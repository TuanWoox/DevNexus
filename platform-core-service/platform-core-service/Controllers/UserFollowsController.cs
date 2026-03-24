using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserFollowsController(IUserFollowService userFollowService) : ControllerBase
    {
        private readonly IUserFollowService _userFollowService = userFollowService;

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateUserFollow createUserFollow)
        {
            ReturnResult<object> returnResult = new();
            try
            {
                returnResult = await _userFollowService.CreateAsync(createUserFollow);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("followers/paging")]
        public async Task<IActionResult> GetFollowers(Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                returnResult = await _userFollowService.GetFollowers(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("followings/paging")]
        public async Task<IActionResult> GetFollowings(Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                returnResult = await _userFollowService.GetFollowings(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("{followId}")]
        public async Task<IActionResult> DeleteById(string followId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _userFollowService.DeleteById(followId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDeleteByIds(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _userFollowService.BulkDeleteByIds(page.Selected);
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
