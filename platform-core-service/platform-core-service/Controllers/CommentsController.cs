using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentsController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCommentDTO createDTO)
        {
            var returnResult = new ReturnResult<SelectCommentDTO>();
            try
            {
                returnResult = await _commentService.CreateAsync(createDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var returnResult = new ReturnResult<SelectCommentDTO>();
            try
            {
                returnResult = await _commentService.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("{id}/replies")]
        public async Task<IActionResult> GetReplies(string id, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                returnResult = await _commentService.GetRepliesAsync(id, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [Authorize]
        [HttpPost("my-comments")]
        public async Task<IActionResult> GetMyComments([FromBody] CommentFilterPageDTO filterPageDTO)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                returnResult = await _commentService.GetMyCommentsAsync(filterPageDTO.Filter, filterPageDTO.Page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("by-post/{postId}")]
        public async Task<IActionResult> GetCommentsByPost(string postId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                returnResult = await _commentService.GetCommentsByPostAsync(postId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [AllowAnonymous]
        [HttpPost("by-answer/{answerId}")]
        public async Task<IActionResult> GetCommentsByAnswer(string answerId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                returnResult = await _commentService.GetCommentsByAnswerAsync(answerId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [Authorize]
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateCommentDTO updateDTO)
        {
            var returnResult = new ReturnResult<SelectCommentDTO>();
            try
            {
                returnResult = await _commentService.UpdateAsync(updateDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteById(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _commentService.DeleteByIdAsync(id);
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
