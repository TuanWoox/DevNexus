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

                // 3. Check target visibility at save time.
                string targetPostId = hasPost ? dto.PostId! : dto.QAPostId!;
                var saveAccess = hasPost
                    ? await _socialGuardService.CanSavePost(targetPostId)
                    : await _socialGuardService.CanSaveQuestion(targetPostId);
                if (!saveAccess.Result)
                {
                    returnResult.Message = saveAccess.Message ?? ResponseMessage.NO_PERMISSION_TO_SAVE;
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

                // 5. Save
                var item = _mapper.Map<BookMarkedItem>(dto);
                await _dbContext.BookMarkedItems.AddAsync(item);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectBookMarkedItem>(item);
                    var postDto = returnResult.Result.Post ?? (returnResult.Result.QAPost as platform_core_service.Common.Models.DTOs.EntityDTO.Post.SelectPostDTO);
                    if (postDto != null)
                    {
                        postDto.IsSaved = true;
                        postDto.SavedBookMarkedItemId = returnResult.Result.Id;
                    }
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
                                                        .ThenInclude(p => p.Author)
                                                    .Include(x => x.Post)
                                                        .ThenInclude(p => p.Community)
                                                    .Include(x => x.Post)
                                                        .ThenInclude(p => p.PostTags)
                                                            .ThenInclude(pt => pt.Tag)
                                                    .Include(x => x.QAPost)
                                                        .ThenInclude(p => p.Author)
                                                    .Include(x => x.QAPost)
                                                        .ThenInclude(p => p.Community)
                                                    .Include(x => x.QAPost)
                                                        .ThenInclude(p => p.PostTags)
                                                            .ThenInclude(pt => pt.Tag)
                                                    .AsNoTracking()
                                                    .AsQueryable();

                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectBookMarkedItem>(query, page);

                if (returnResult.Result?.Data != null && returnResult.Result.Data.Any())
                {
                    // ── ACCESS CONTROL: re-validate permissions for every saved item ──
                    // A user may have lost access to a post since they saved it (e.g. banned
                    // from a private community, left, or author changed privacy settings).
                    // We nullify Post/QAPost instead of removing the item so the frontend
                    // receives the item with null data and can render UnavailablePostCard,
                    // giving the user a way to remove it from their collection.
                    foreach (var item in returnResult.Result.Data)
                    {
                        var accessCheck = await CanViewBookmarkedTarget(item);

                        if (!accessCheck.Result)
                        {
                            MarkUnavailable(item, accessCheck.Message);
                                // Access denied — nullify content but keep the bookmark record
                            continue;
                        }

                        // Access granted — mark the item as saved
                        var postDto = item.Post ?? (item.QAPost as platform_core_service.Common.Models.DTOs.EntityDTO.Post.SelectPostDTO);
                        if (postDto != null)
                        {
                            postDto.IsSaved = true;
                            postDto.SavedBookMarkedItemId = item.Id;
                        }
                    }

                    // Enrich only the items that still have accessible post data
                    var postDtos = returnResult.Result.Data
                        .Select(x => x.Post ?? (x.QAPost as platform_core_service.Common.Models.DTOs.EntityDTO.Post.SelectPostDTO))
                        .Where(x => x != null)
                        .ToList();

                    if (postDtos.Any())
                    {
                        await SetCurrentUserVotesForListAsync(postDtos!);
                        await SetCommentCountForListAsync(postDtos!);
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching bookmarked items: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        private async Task SetCurrentUserVotesForListAsync(List<platform_core_service.Common.Models.DTOs.EntityDTO.Post.SelectPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var votes = await _dbContext.Votes
                .Where(v => v.AuthorId == profileId && postIds.Contains(v.PostId))
                .Select(v => new { v.PostId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes.ToDictionary(v => v.PostId, v => (bool?)v.IsUpvote);

            foreach (var dto in dtos)
            {
                dto.CurrentUserVote = voteMap.TryGetValue(dto.Id, out var vote) ? vote : null;
            }
        }

        private async Task SetCommentCountForListAsync(List<platform_core_service.Common.Models.DTOs.EntityDTO.Post.SelectPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var comments = await _dbContext.Comments
                .Where(c => c.PostId != null && postIds.Contains(c.PostId))
                .GroupBy(c => c.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId!, x => x.Count);

            foreach (var dto in dtos)
            {
                dto.CommentCount = comments.TryGetValue(dto.Id, out var count) ? count : 0;
            }
        }

        private async Task<ReturnResult<bool>> CanViewBookmarkedTarget(SelectBookMarkedItem item)
        {
            if (!string.IsNullOrEmpty(item.PostId))
            {
                return await _socialGuardService.CanViewPost(item.PostId);
            }

            if (!string.IsNullOrEmpty(item.QAPostId))
            {
                return await _socialGuardService.CanViewQAPost(item.QAPostId);
            }

            return new ReturnResult<bool>
            {
                Result = false,
                Message = ResponseMessage.CONTENT_NOT_AVAILABLE
            };
        }

        private static void MarkUnavailable(SelectBookMarkedItem item, string? message)
        {
            item.Post = null;
            item.QAPost = null;
            item.IsUnavailable = true;
            item.UnavailableMessage = message ?? ResponseMessage.CONTENT_NOT_AVAILABLE;
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
