using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class BookMarkedItemService(
        ApplicationDbContext dbContext,
        IMapper mapper,
        IRepository<BookMarkedItem, string> repository,
        IUserContext userContext,
        ISocialGuardService socialGuardService
    ) : IBookMarkItemService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<BookMarkedItem, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;
        private readonly ISocialGuardService _socialGuardService = socialGuardService;

        public async Task<ReturnResult<SelectBookMarkedItem>> CreateAsync(CreateBookMarkedItem dto)
        {
            ReturnResult<SelectBookMarkedItem> returnResult = new();
            try
            {
                // 1. Validate exactly one target ID is provided
                var hasPost = !string.IsNullOrEmpty(dto.PostId);
                var hasQAPost = !string.IsNullOrEmpty(dto.QAPostId);
                if (hasPost == hasQAPost) // both true or both false
                {
                    returnResult.Message = "Provide exactly one target ID: either PostId or QAPostId.";
                    return returnResult;
                }

                // 2. Caller must own the target BookMark
                var bookMark = await _dbContext.BookMarks.Where(x => x.Id == dto.BookMarkId && x.OwnerId == _userContext.ProfileId)
                                                        .AsNoTracking()
                                                        .FirstOrDefaultAsync();
                if (bookMark == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "bookmark", dto.BookMarkId);
                    return returnResult;
                }

                // 3. Load the target post (Post or QAPost both inherit Post)
                string targetPostId = hasPost ? dto.PostId! : dto.QAPostId!;

                var post = await _dbContext.Posts.Where(x => x.Id == targetPostId)
                                                .Include(x => x.Author)
                                                .AsNoTracking()
                                                .FirstOrDefaultAsync();
                if (post == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "post", targetPostId);
                    return returnResult;
                }

                // 4. Duplicate check — scoped to user's own bookmark, safe to run before access guard
                var duplicate = await _dbContext.BookMarkedItems
                                                .Where(x => x.BookMarkId == dto.BookMarkId &&
                                                            (hasPost ? x.PostId == dto.PostId : x.QAPostId == dto.QAPostId))
                                                .AsNoTracking()
                                                .AnyAsync();
                if (duplicate)
                {
                    returnResult.Message = "This item is already in the bookmark.";
                    return returnResult;
                }

                // 5. Check access rights
                var accessCheck = await _socialGuardService.CheckVisibleContent(post.AuthorId, post.CommunityId);
                if (accessCheck.Message != null)
                {
                    returnResult.Message = accessCheck.Message;
                    return returnResult;
                }

                // 5. Save
                var item = _mapper.Map<BookMarkedItem>(dto);
                await _dbContext.BookMarkedItems.AddAsync(item);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectBookMarkedItem>(item);
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error creating bookmarked item: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectBookMarkedItem, string>>> GetItemsByBookMarkIdAsync(
            string bookMarkId, Page<string> page)
        {
            ReturnResult<PagedData<SelectBookMarkedItem, string>> returnResult = new();
            try
            {
                // Ensure the caller owns this bookmark
                var bookMarkExists = await _dbContext.BookMarks.Where(x => x.Id == bookMarkId && x.OwnerId == _userContext.ProfileId)
                                                            .AsNoTracking()
                                                            .AnyAsync();

                if (!bookMarkExists)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "bookmark", bookMarkId);
                    return returnResult;
                }

                var query = _dbContext.BookMarkedItems.Where(x => x.BookMarkId == bookMarkId)
                                                    .Include(x => x.Post)
                                                    .Include(x => x.QAPost)
                                                    .AsNoTracking()
                                                    .AsQueryable();

                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectBookMarkedItem>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching bookmarked items: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> DeleteById(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var item = await _dbContext.BookMarkedItems
                    .Where(x => x.Id == id)
                    .Include(x => x.BookMark)
                    .FirstOrDefaultAsync();

                if (item == null || item.BookMark.OwnerId != _userContext.ProfileId)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "bookmarked item", id);
                    return returnResult;
                }

                _dbContext.BookMarkedItems.Remove(item);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting bookmarked item: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkDeleteByIds(List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var items = await _dbContext.BookMarkedItems
                    .Where(x => ids.Contains(x.Id))
                    .Include(x => x.BookMark)
                    .ToListAsync();

                var ownedItems = items.Where(x => x.BookMark.OwnerId == _userContext.ProfileId).ToList();

                if (ownedItems.Count != ids.Count)
                {
                    returnResult.Message = "One or more bookmarked items were not found or do not belong to you.";
                    return returnResult;
                }

                _dbContext.BookMarkedItems.RemoveRange(ownedItems);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = ownedItems.Count;
                }
                else
                {
                    returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk deleting bookmarked items: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
