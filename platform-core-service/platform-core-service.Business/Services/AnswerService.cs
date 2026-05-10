using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AnswerService : IAnswerService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<Answer, string> _answerRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public AnswerService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<Answer, string> answerRepository,
            IBackgroundJobClient backgroundJobClient)
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _answerRepository = answerRepository;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ReturnResult<SelectAnswerDTO>> CreateAsync(CreateAnswerDTO answerDTO)
        {
            var result = new ReturnResult<SelectAnswerDTO>();
            try
            {
                // Step 1: Validate input
                if (answerDTO == null || string.IsNullOrEmpty(answerDTO.QAPostId))
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
                    .AnyAsync(p => p.Id == answerDTO.QAPostId);
                if (!postExists)
                {
                    result.Message = $"QAPost {answerDTO.QAPostId} not found";
                    return result;
                }

                // Step 4: Map and set server-side fields
                var answer = _mapper.Map<Answer>(answerDTO);
                answer.Id = Guid.NewGuid().ToString();
                answer.AuthorId = profileId;
                answer.QAPostId = answerDTO.QAPostId;

                // Step 5: Save
                _dbContext.Answers.Add(answer);
                await _dbContext.SaveChangesAsync();

                await PublishAnswerNotificationAsync(answer.Id, profileId);

                // Step 6: Reload with author and return
                var saved = await _dbContext.Answers
                    .Include(a => a.Author)
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

                // Step 2: Load with author (public read — no ownership check)
                var answer = await _dbContext.Answers
                    .Include(a => a.Author)
                    .FirstOrDefaultAsync(a => a.Id == answerId);

                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectAnswerDTO>(answer);
                await SetCurrentUserVoteAsync(result.Result);
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
                    .Include(a => a.Author)
                    .AsQueryable();

                result.Result = await _answerRepository.GetPagingAsync<Page<string>, SelectAnswerDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving answers: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectAnswerDTO>> UpdateAsync(UpdateAnswerDTO answerDTO)
        {
            var result = new ReturnResult<SelectAnswerDTO>();
            try
            {
                // Step 1: Validate
                if (answerDTO == null || string.IsNullOrEmpty(answerDTO.Id))
                {
                    result.Message = "Answer ID and update data are required";
                    return result;
                }

                // Step 2: Load entity
                var answer = await _dbContext.Answers.FirstOrDefaultAsync(a => a.Id == answerDTO.Id);
                if (answer == null)
                {
                    result.Message = $"Answer {answerDTO.Id} not found";
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

                var saved = await _dbContext.Answers
                    .Include(a => a.Author)
                    .FirstOrDefaultAsync(a => a.Id == answer.Id);

                result.Result = _mapper.Map<SelectAnswerDTO>(saved);
                await SetCurrentUserVoteAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating answer: {ex.Message}";
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
        private async Task SetCurrentUserVotesForListAsync(List<SelectAnswerDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var answerIds = dtos.Select(s => s.Id).ToList();

            var votes = await _dbContext.Votes
                .Where(v => v.AuthorId == profileId && answerIds.Contains(v.AnswerId))
                .Select(v => new { v.AnswerId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes.ToDictionary(v => v.AnswerId, v => (bool?)v.IsUpvote);

            foreach (var dto in dtos)
            {
                dto.CurrentUserVote = voteMap.TryGetValue(dto.Id, out var vote) ? vote : null;
            }
        }
        private async Task SetCurrentUserVoteAsync(SelectAnswerDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var vote = await _dbContext.Votes
                .Where(v => v.AuthorId == profileId && v.AnswerId == dto.Id)
                .Select(v => (bool?)v.IsUpvote)
                .FirstOrDefaultAsync();

            dto.CurrentUserVote = vote;
        }

        private async Task PublishAnswerNotificationAsync(string answerId, string actorId)
        {
            var answer = await _dbContext.Answers
                .Include(a => a.QAPost)
                .FirstOrDefaultAsync(a => a.Id == answerId);

            if (answer?.QAPost == null)
            {
                return;
            }

            var recipientId = answer.QAPost.AuthorId;
            if (string.IsNullOrEmpty(recipientId) || recipientId == actorId)
            {
                return;
            }

            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.NEW_ANSWER,
                ActorId = actorId,
                RecipientId = recipientId,
                EntityType = NotificationEntityType.ANSWER,
                EntityId = answerId,
                EntityTitle = answer.QAPost.Title,
                EntityPreview = answer.Content?.Substring(0, Math.Min(200, answer.Content?.Length ?? 0)),
                ActionUrl = $"/questions/{answer.QAPostId}#answer-{answerId}"
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.answer"));
        }
    }
}
