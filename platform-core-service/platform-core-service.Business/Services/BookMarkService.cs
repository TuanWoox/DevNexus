using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMark;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class BookMarkService
    (
        ApplicationDbContext dbContext,
        IMapper mapper,
        IRepository<BookMark, string> repository,
        IUserContext userContext
    ) : IBookMarkService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<BookMark, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;

        public async Task<ReturnResult<SelectBookMark>> CreateAsync(CreateBookMark dto)
        {
            ReturnResult<SelectBookMark> returnResult = new();
            try
            {
                var duplicate = await _dbContext.BookMarks
                    .Where(x => x.OwnerId == _userContext.ProfileId
                             && x.Name.ToLower() == dto.Name.ToLower())
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (duplicate != null)
                {
                    returnResult.Message = $"A bookmark named '{dto.Name}' already exists.";
                    return returnResult;
                }

                var bookMark = _mapper.Map<BookMark>(dto);
                bookMark.OwnerId = _userContext.ProfileId;

                await _dbContext.BookMarks.AddAsync(bookMark);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectBookMark>(bookMark);
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error creating bookmark: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectBookMark, string>>> GetMyBookMarksAsync(Page<string> page)
        {
            ReturnResult<PagedData<SelectBookMark, string>> returnResult = new();
            try
            {
                var query = _dbContext.BookMarks
                    .Where(x => x.OwnerId == _userContext.ProfileId)
                    .AsNoTracking()
                    .AsQueryable();

                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectBookMark>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching bookmarks: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<SelectBookMark>> UpdateAsync(UpdateBookMark dto)
        {
            ReturnResult<SelectBookMark> returnResult = new();
            try
            {
                var bookMark = await _dbContext.BookMarks
                    .Where(x => x.Id == dto.Id && x.OwnerId == _userContext.ProfileId)
                    .FirstOrDefaultAsync();

                if (bookMark == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "bookmark", dto.Id);
                    return returnResult;
                }

                // Name uniqueness check — exclude current record
                var duplicate = await _dbContext.BookMarks
                    .Where(x => x.OwnerId == _userContext.ProfileId
                             && x.Id != dto.Id
                             && x.Name.ToLower() == dto.Name.ToLower())
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (duplicate != null)
                {
                    returnResult.Message = $"A bookmark named '{dto.Name}' already exists.";
                    return returnResult;
                }

                bookMark.Name = dto.Name;

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = _mapper.Map<SelectBookMark>(bookMark);
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error updating bookmark: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> DeleteById(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var bookMark = await _dbContext.BookMarks
                    .Where(x => x.Id == id && x.OwnerId == _userContext.ProfileId)
                    .FirstOrDefaultAsync();

                if (bookMark == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "bookmark", id);
                    return returnResult;
                }

                _dbContext.BookMarks.Remove(bookMark);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting bookmark: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkDeleteByIds(List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var bookMarks = await _dbContext.BookMarks
                    .Where(x => ids.Contains(x.Id) && x.OwnerId == _userContext.ProfileId)
                    .ToListAsync();

                if (bookMarks.Count != ids.Count)
                {
                    returnResult.Message = "One or more bookmarks were not found or do not belong to you.";
                    return returnResult;
                }

                _dbContext.BookMarks.RemoveRange(bookMarks);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = bookMarks.Count;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk deleting bookmarks: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
