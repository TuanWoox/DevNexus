using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileCommunityBlocksController(IProfileCommunityBlockService blockService) : ControllerBase
    {
        private readonly IProfileCommunityBlockService _blockService = blockService;

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateProfileCommunityBlock createBlock)
        {
            ReturnResult<SelectProfileCommunityBlock> returnResult = new();
            try
            {
                returnResult = await _blockService.CreateAsync(createBlock);
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
            ReturnResult<PagedData<SelectProfileCommunityBlock, string>> returnResult = new();
            try
            {
                returnResult = await _blockService.GetPagingAsync(page);
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
                returnResult = await _blockService.DeleteById(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteByIds(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _blockService.DeleteByIds(page.Selected);
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
