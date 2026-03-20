using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnswersController : ControllerBase
    {
        private readonly IAnswerService _answerService;

        public AnswersController(IAnswerService answerService)
        {
            _answerService = answerService;
        }

        [HttpPost("{postId}/create")]
        public async Task<IActionResult> Create(string postId, [FromBody] CreateAnswerDTO dto)
        {
            var returnResult = new ReturnResult<SelectAnswerDTO>();
            try
            {
                returnResult = await _answerService.CreateAsync(postId, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            var returnResult = new ReturnResult<SelectAnswerDTO>();
            try
            {
                returnResult = await _answerService.GetAnswerByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("{postId}/paging")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByPostId(string postId, [FromBody] Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<SelectAnswerDTO, string>>();
            try
            {
                returnResult = await _answerService.GetAnswersByPostIdAsync(postId, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAnswerDTO dto)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _answerService.UpdateAsync(id, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteById(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _answerService.DeleteByIdAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptAnswer(string id)
        {
            var returnResult = new ReturnResult<bool>();
            try
            {
                returnResult = await _answerService.AcceptAnswerAsync(id, string.Empty);
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
