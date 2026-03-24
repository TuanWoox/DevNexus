using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileBlocksController(IProfileBlockService profileBlockService) : ControllerBase
    {
        private readonly IProfileBlockService _profileBlockService = profileBlockService;

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateProfileBlock createProfileBlock)
        {
            ReturnResult<SelectProfileBlock> returnResult = new();
            try
            {
                returnResult = await _profileBlockService.CreateAsync(createProfileBlock);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }
        [HttpPost("paging")]
        public async Task<IActionResult> GetPaging(Page<string> page)
        {
            ReturnResult<PagedData<SelectProfileBlock, string>> returnResult = new();
            try
            {
                returnResult = await _profileBlockService.GetPagingAsync(page);
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
                returnResult = await _profileBlockService.DeleteById(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }
        [HttpDelete]
        public async Task<IActionResult> DeleteByIdS(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _profileBlockService.DeleteByIds(page.Selected);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }
        // [HttpDelete("blockprofileid/{blockProfileId}")]
        // public async Task<IActionResult> DeleteByBlockProfileId(string blockProfileId)
        // {
        //     ReturnResult<bool> returnResult = new();
        //     try
        //     {
        //         returnResult = await _profileBlockService.DeleteByBlockProfileIdAsync(blockProfileId);
        //     }
        //     catch (Exception ex)
        //     {
        //         DevNexusLogger.Instance.Debug(ex.Message);
        //         returnResult.Message = ex.Message;
        //     }
        //     return Ok(returnResult);
        // }
    }
}