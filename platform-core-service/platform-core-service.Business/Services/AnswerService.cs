using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class AnswerService : IAnswerService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<Answer, string> _answerRepository;

        public AnswerService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<Answer, string> answerRepository)
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _answerRepository = answerRepository;
        }

        public async Task<ReturnResult<SelectAnswerDTO>> CreateAsync(string postId, CreateAnswerDTO answerDTO)
        {
            var result = new ReturnResult<SelectAnswerDTO>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(postId) || answerDTO == null)
                {
                    result.Message = "Post ID and answer data are required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Verify QAPost exists
                var postExists = await _dbContext.Posts
                    .OfType<QAPost>()
                    .AnyAsync(p => p.Id == postId);
                if (!postExists)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                // Step 4: Map and set server-side fields
                var answer = _mapper.Map<Answer>(answerDTO);
                answer.Id = Guid.NewGuid().ToString();
                answer.AuthorId = profileId;
                answer.QAPostId = postId;

                // Step 5: Save
                _dbContext.Answers.Add(answer);
                await _dbContext.SaveChangesAsync();

                // Step 6: Reload and return
                var saved = await _dbContext.Answers
                    .FirstOrDefaultAsync(a => a.Id == answer.Id);

                result.Result = _mapper.Map<SelectAnswerDTO>(saved);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while creating answer: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectAnswerDTO>> GetAnswerByIdAsync(string answerId)
        {
            var result = new ReturnResult<SelectAnswerDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(answerId))
                {
                    result.Message = "Answer ID is required";
                    return result;
                }

                // Step 2: Load (public read — no ownership check)
                var answer = await _dbContext.Answers
                    .FirstOrDefaultAsync(a => a.Id == answerId);

                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectAnswerDTO>(answer);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving answer: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectAnswerDTO, string>>> GetAnswersByPostIdAsync(string postId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectAnswerDTO, string>>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(postId))
                {
                    result.Message = "Post ID is required";
                    return result;
                }

                // Step 2: Verify QAPost exists
                var postExists = await _dbContext.Posts.OfType<QAPost>().AnyAsync(p => p.Id == postId);
                if (!postExists)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                // Step 3: Build query and delegate paging
                var query = _dbContext.Answers
                    .Where(a => a.QAPostId == postId)
                    .AsQueryable();

                result.Result = await _answerRepository.GetPagingAsync<Page<string>, SelectAnswerDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving answers: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UpdateAsync(string answerId, UpdateAnswerDTO answerDTO)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(answerId) || answerDTO == null)
                {
                    result.Message = "Answer ID and update data are required";
                    return result;
                }

                // Step 2: Load entity
                var answer = await _dbContext.Answers.FirstOrDefaultAsync(a => a.Id == answerId);
                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                // Step 3: Ownership check
                var profileId = _userContext.ProfileId;
                if (answer.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to update this answer";
                    return result;
                }

                // Step 4: Update and save
                _mapper.Map(answerDTO, answer);
                _dbContext.Answers.Update(answer);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating answer: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<bool>> DeleteByIdAsync(string answerId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(answerId))
                {
                    result.Message = "Answer ID is required";
                    return result;
                }

                // Step 2: Load entity
                var answer = await _dbContext.Answers.FirstOrDefaultAsync(a => a.Id == answerId);
                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                // Step 3: Ownership check
                var profileId = _userContext.ProfileId;
                if (answer.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to delete this answer";
                    return result;
                }

                // Step 4: Delete
                _dbContext.Answers.Remove(answer);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting answer: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<bool>> AcceptAnswerAsync(string answerId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(answerId))
                {
                    result.Message = "Answer ID is required";
                    return result;
                }

                // Step 2: Check auth
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load answer with its QAPost
                var answer = await _dbContext.Answers
                    .Include(a => a.QAPost)
                    .FirstOrDefaultAsync(a => a.Id == answerId);

                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                // Step 4: Only the question author can accept answers
                if (answer.QAPost.AuthorId != profileId)
                {
                    result.Message = "Access denied: Only the question author can accept answers";
                    return result;
                }

                // Step 5: Reset all other accepted answers for this post, then accept this one
                var siblingsAccepted = await _dbContext.Answers
                    .Where(a => a.QAPostId == answer.QAPostId && a.IsAccepted)
                    .ToListAsync();

                foreach (var sibling in siblingsAccepted)
                {
                    sibling.IsAccepted = false;
                }

                answer.IsAccepted = true;

                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while accepting answer: {ex.Message}";
                result.Result = false;
            }
            return result;
        }
    }
}
