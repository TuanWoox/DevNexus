using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Vote;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VotesController : ControllerBase
    {
        private readonly IVoteService _voteService;

        public VotesController(IVoteService voteService)
        {
            _voteService = voteService;
        }

        [HttpPost("post/{postId}")]
        public async Task<IActionResult> VotePost(string postId, [FromBody] VoteRequestDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _voteService.VotePostAsync(postId, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("answer/{answerId}")]
        public async Task<IActionResult> VoteAnswer(string answerId, [FromBody] VoteRequestDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _voteService.VoteAnswerAsync(answerId, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("comment/{commentId}")]
        public async Task<IActionResult> VoteComment(string commentId, [FromBody] VoteRequestDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _voteService.VoteCommentAsync(commentId, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
