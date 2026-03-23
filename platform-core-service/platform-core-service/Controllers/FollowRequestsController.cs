using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FollowRequestsController(IFollowRequestService followRequestService) : ControllerBase
    {
        private readonly IFollowRequestService _followRequestService = followRequestService;

        [HttpPut("{requestId}/approve")]
        public async Task<IActionResult> ApproveFollowRequest(string requestId)
        {
            ReturnResult<SelectUserFollow> returnResult = new();
            try
            {
                returnResult = await _followRequestService.ApproveFollowRequest(requestId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("{requestId}/reject")]
        public async Task<IActionResult> RejectFollowRequest(string requestId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _followRequestService.RejectFollowRequest(requestId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("{requestId}/cancel")]
        public async Task<IActionResult> CancelFollowRequest(string requestId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _followRequestService.CancelFollowRequest(requestId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("received/paging")]
        public async Task<IActionResult> GetReceivedRequests(Page<string> page)
        {
            ReturnResult<PagedData<SelectFollowRequest, string>> returnResult = new();
            try
            {
                returnResult = await _followRequestService.GetReceivedRequestFollow(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPost("sent/paging")]
        public async Task<IActionResult> GetSentRequests(Page<string> page)
        {
            ReturnResult<PagedData<SelectFollowRequest, string>> returnResult = new();
            try
            {
                returnResult = await _followRequestService.GetSentRequestFollow(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpPut("bulk/approve")]
        public async Task<IActionResult> BulkApproveFollowRequests(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _followRequestService.BulkApproveFollowRequests(page.Selected);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("bulk/reject")]
        public async Task<IActionResult> BulkRejectFollowRequests(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _followRequestService.BulkRejectFollowRequests(page.Selected);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = ex.Message;
            }
            return Ok(returnResult);
        }

        [HttpDelete("bulk/cancel")]
        public async Task<IActionResult> BulkCancelFollowRequests(Page<string> page)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                returnResult = await _followRequestService.BulkCancelFollowRequests(page.Selected);
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
