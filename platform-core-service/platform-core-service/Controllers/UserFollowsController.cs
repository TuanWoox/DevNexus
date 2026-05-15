using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

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

        [HttpDelete]
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

        [HttpPost("{profileId}/followers/paging")]
        public async Task<IActionResult> GetFollowersByProfileId(string profileId, Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                returnResult = await _userFollowService.GetFollowersByProfileId(profileId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("{profileId}/followings/paging")]
        public async Task<IActionResult> GetFollowingsByProfileId(string profileId, Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                returnResult = await _userFollowService.GetFollowingsByProfileId(profileId, page);
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
