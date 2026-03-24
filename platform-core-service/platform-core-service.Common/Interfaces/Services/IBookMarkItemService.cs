using platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IBookMarkItemService
    {
        Task<ReturnResult<SelectBookMarkedItem>> CreateAsync(CreateBookMarkedItem dto);
        Task<ReturnResult<PagedData<SelectBookMarkedItem, string>>> GetItemsByBookMarkIdAsync(string bookMarkId, Page<string> page);
        Task<ReturnResult<bool>> DeleteById(string id);
        Task<ReturnResult<int>> BulkDeleteByIds(List<string> ids);
    }
}