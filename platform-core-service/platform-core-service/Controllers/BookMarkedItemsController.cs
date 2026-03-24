using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookMarkedItemsController(IBookMarkItemService bookMarkItemService) : ControllerBase
    {
        private readonly IBookMarkItemService _bookMarkItemService = bookMarkItemService;

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateBookMarkedItem dto)
        {
            ReturnResult<SelectBookMarkedItem> returnResult = new();
            try
            {
                returnResult = await _bookMarkItemService.CreateAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetItemsByBookMarkIdAsync([FromQuery] string bookMarkId, Page<string> page)
        {
            ReturnResult<PagedData<SelectBookMarkedItem, string>> returnResult = new();
            try
            {
                returnResult = await _bookMarkItemService.GetItemsByBookMarkIdAsync(bookMarkId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteById(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _bookMarkItemService.DeleteById(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete]
        public async Task<IActionResult> BulkDeleteByIds(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _bookMarkItemService.BulkDeleteByIds(page.Selected);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }
    }
}
