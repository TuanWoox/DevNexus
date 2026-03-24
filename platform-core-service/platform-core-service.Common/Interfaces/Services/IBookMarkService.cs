using platform_core_service.Common.Models.DTOs.EntityDTO.BookMark;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IBookMarkService
    {
        public Task<ReturnResult<SelectBookMark>> CreateAsync(CreateBookMark dto);
        public Task<ReturnResult<PagedData<SelectBookMark, string>>> GetMyBookMarksAsync(Page<string> page);
        public Task<ReturnResult<SelectBookMark>> UpdateAsync(UpdateBookMark dto);
        public Task<ReturnResult<bool>> DeleteById(string id);
        public Task<ReturnResult<int>> BulkDeleteByIds(List<string> ids);
    }
}