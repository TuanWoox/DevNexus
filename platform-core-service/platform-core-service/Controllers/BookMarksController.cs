using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMark;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookMarksController(IBookMarkService bookMarkService) : ControllerBase
    {
        private readonly IBookMarkService _bookMarkService = bookMarkService;

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateBookMark dto)
        {
            ReturnResult<SelectBookMark> returnResult = new();
            try
            {
                returnResult = await _bookMarkService.CreateAsync(dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("paging")]
        public async Task<IActionResult> GetMyBookMarksAsync(Page<string> page)
        {
            ReturnResult<PagedData<SelectBookMark, string>> returnResult = new();
            try
            {
                returnResult = await _bookMarkService.GetMyBookMarksAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAsync(UpdateBookMark dto)
        {
            ReturnResult<SelectBookMark> returnResult = new();
            try
            {
                returnResult = await _bookMarkService.UpdateAsync(dto);
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
                returnResult = await _bookMarkService.DeleteById(id);
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
                returnResult = await _bookMarkService.BulkDeleteByIds(page.Selected);
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
