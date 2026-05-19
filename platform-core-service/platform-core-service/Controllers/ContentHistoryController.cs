using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPostHistory;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContentHistoryController : ControllerBase
    {
        private readonly IContentHistoryServiceFactory _historyFactory;

        public ContentHistoryController(IContentHistoryServiceFactory historyFactory)
        {
            _historyFactory = historyFactory;
        }

        [AllowAnonymous]
        [HttpPost("posts/{postId}")]
        public async Task<IActionResult> GetPostHistory(string postId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<PostHistoryDTO, string>>();
            try
            {
                returnResult.Result = await _historyFactory.GetPostHistoryService().GetHistoryAsync(postId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("qaposts/{qaPostId}")]
        public async Task<IActionResult> GetQAPostHistory(string qaPostId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<QAPostHistoryDTO, string>>();
            try
            {
                returnResult.Result = await _historyFactory.GetQAPostHistoryService().GetHistoryAsync(qaPostId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("comments/{commentId}")]
        public async Task<IActionResult> GetCommentHistory(string commentId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<CommentHistoryDTO, string>>();
            try
            {
                returnResult.Result = await _historyFactory.GetCommentHistoryService().GetHistoryAsync(commentId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("answers/{answerId}")]
        public async Task<IActionResult> GetAnswerHistory(string answerId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<AnswerHistoryDTO, string>>();
            try
            {
                returnResult.Result = await _historyFactory.GetAnswerHistoryService().GetHistoryAsync(answerId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpGet("{historyId}")]
        public async Task<IActionResult> GetHistoryVersion(string historyId, [FromQuery] string type)
        {
            var returnResult = new ReturnResult<object>();
            try
            {
                returnResult.Result = type.ToLowerInvariant() switch
                {
                    "post" => await _historyFactory.GetPostHistoryService().GetVersionAsync(historyId),
                    "qapost" => await _historyFactory.GetQAPostHistoryService().GetVersionAsync(historyId),
                    "comment" => await _historyFactory.GetCommentHistoryService().GetVersionAsync(historyId),
                    "answer" => await _historyFactory.GetAnswerHistoryService().GetVersionAsync(historyId),
                    _ => null
                };

                if (returnResult.Result == null && type.ToLowerInvariant() is not ("post" or "qapost" or "comment" or "answer"))
                {
                    returnResult.Message = "Invalid type. Must be: post, qapost, comment, or answer";
                }
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
