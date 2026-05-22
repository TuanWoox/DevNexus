using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
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
        private readonly IContentMediaLinkService _contentMediaLinkService;
        private readonly IAnswerHistoryService _answerHistoryService;
        private readonly ISocialGuardService _socialGuardService;

        public AnswerService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<Answer, string> answerRepository,
            IBackgroundJobClient backgroundJobClient,
            IContentMediaLinkService contentMediaLinkService,
            IAnswerHistoryService answerHistoryService,
            ISocialGuardService socialGuardService)
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _answerRepository = answerRepository;
            _backgroundJobClient = backgroundJobClient;
            _contentMediaLinkService = contentMediaLinkService;
            _answerHistoryService = answerHistoryService;
            _socialGuardService = socialGuardService;
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

                // Step 3: Verify QAPost is visible before allowing writes
                var questionAccess = await _socialGuardService.CanAnswerQuestion(answerDTO.QAPostId);
                if (!questionAccess.Result)
                {
                    result.Message = questionAccess.Message ?? ResponseMessage.NO_PERMISSION_TO_ANSWER;
                    return result;
                }

                var parentPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(p => p.Id == answerDTO.QAPostId)
                    .Select(p => new { p.Id, p.CommunityId })
                    .FirstOrDefaultAsync();
                if (parentPost == null)
                {
                    result.Message = ResponseMessage.NO_PERMISSION_TO_ANSWER;
                    return result;
                }

                if (!string.IsNullOrEmpty(parentPost.CommunityId))
                {
                    var muteCheck = await _socialGuardService.CheckIsMutedInCommunityAsync(profileId, parentPost.CommunityId);
                    if (muteCheck.Message != null)
                    {
                        result.Message = muteCheck.Message;
                        return result;
                    }
                }

                // Step 4: Map and set server-side fields
                var answer = _mapper.Map<Answer>(answerDTO);
                answer.Id = Guid.NewGuid().ToString();
                answer.AuthorId = profileId;
                answer.QAPostId = answerDTO.QAPostId;

                // Step 5: Save
                _dbContext.Answers.Add(answer);
                await _dbContext.SaveChangesAsync();

                await _contentMediaLinkService.LinkAnswerMediaAsync(_userContext.UserId, answer.Id, answerDTO.MediaIds);

                await PublishAnswerNotificationAsync(answer.Id, profileId);
                await _answerHistoryService.RecordHistoryAsync(answer.Id);

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

                var accessCheck = await _socialGuardService.CanViewAnswer(answer.Id);
                if (!accessCheck.Result)
                {
                    result.Message = accessCheck.Message ?? ResponseMessage.ANSWER_NOT_AVAILABLE;
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

                // Step 2: Verify QAPost is visible before returning answers
                var questionAccess = await _socialGuardService.CanViewQAPost(postId);
                if (!questionAccess.Result)
                {
                    result.Message = questionAccess.Message ?? ResponseMessage.QUESTION_NOT_AVAILABLE;
                    return result;
                }

                // Step 3: Build query and delegate paging
                var query = _dbContext.Answers
                    .Where(a => a.QAPostId == postId)
                    .ApplyAnswerVisibilityRules(_dbContext, _userContext.ProfileId)
                    .Include(a => a.Author)
                    .AsQueryable();

                // Override sorting: IsAccepted DESC -> TotalVote DESC -> DateCreated DESC
                page.Orders = new List<platform_core_service.Common.Models.DTOs.PagingDTO.OrderMapping>
                {
                    new platform_core_service.Common.Models.DTOs.PagingDTO.OrderMapping
                    {
                        Sort = "IsAccepted",
                        SortDir = platform_core_service.Common.Utils.Enums.SortOrderType.DESC
                    },
                    new platform_core_service.Common.Models.DTOs.PagingDTO.OrderMapping
                    {
                        Sort = "UpvoteCount - DownvoteCount",
                        SortDir = platform_core_service.Common.Utils.Enums.SortOrderType.DESC
                    },
                    new platform_core_service.Common.Models.DTOs.PagingDTO.OrderMapping
                    {
                        Sort = "DateCreated",
                        SortDir = platform_core_service.Common.Utils.Enums.SortOrderType.DESC
                    }
                };

                result.Result = await _answerRepository.GetPagingAsync<Page<string>, SelectAnswerDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                    await PopulateRepliesForAnswersAsync(result.Result.Data.ToList());
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

                await _contentMediaLinkService.LinkAnswerMediaAsync(_userContext.UserId, answerDTO.Id, answerDTO.MediaIds);
                await _answerHistoryService.RecordHistoryAsync(answerDTO.Id);

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
                var answer = await _dbContext.Answers
                    .Include(a => a.QAPost)
                    .FirstOrDefaultAsync(a => a.Id == answerId);
                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                // Step 3: Check ownership or community moderation permissions
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                var communityId = answer.QAPost?.CommunityId;
                if (!string.IsNullOrEmpty(communityId))
                {
                    var isModerator = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(profileId, communityId);
                    if (answer.AuthorId != profileId && !isModerator.Result)
                    {
                        result.Message = "You do not have permission to delete this answer";
                        return result;
                    }
                }
                else if (answer.AuthorId != profileId)
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

                var accessCheck = await _socialGuardService.CanViewAnswer(answer.Id);
                if (!accessCheck.Result)
                {
                    result.Message = accessCheck.Message ?? ResponseMessage.ANSWER_NOT_AVAILABLE;
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

                await PublishAcceptAnswerNotificationAsync(answer.Id, profileId);

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

        private async Task PopulateRepliesForAnswersAsync(List<SelectAnswerDTO> answers)
        {
            if (answers == null || !answers.Any()) return;

            var answerIds = answers.Select(a => a.Id).ToList();

            // Load all comments for these answers in one query
            var comments = await _dbContext.Comments
                .Where(c => answerIds.Contains(c.AnswerId) && !c.Deleted)
                .ApplyCommentVisibilityRules(_dbContext, _userContext.ProfileId)
                .Include(c => c.Author)
                .OrderBy(c => c.DateCreated)
                .ToListAsync();

            if (!comments.Any()) return;

            // Get current user's votes on these comments
            string profileId = _userContext.ProfileId;
            Dictionary<string, bool?> commentVotes = new Dictionary<string, bool?>();
            
            if (!string.IsNullOrEmpty(profileId))
            {
                var commentIds = comments.Select(c => c.Id).ToList();
                var votes = await _dbContext.Votes
                    .Where(v => v.AuthorId == profileId && commentIds.Contains(v.CommentId))
                    .Select(v => new { v.CommentId, v.IsUpvote })
                    .ToListAsync();

                commentVotes = votes.ToDictionary(v => v.CommentId, v => (bool?)v.IsUpvote);
            }

            // Map comments to DTOs and group by AnswerId
            var commentDTOs = _mapper.Map<List<SelectCommentDTO>>(comments);
            
            // Set current user votes
            foreach (var commentDTO in commentDTOs)
            {
                if (commentVotes.TryGetValue(commentDTO.Id, out var vote))
                {
                    commentDTO.CurrentUserVote = vote;
                }
            }

            var commentsByAnswer = commentDTOs.GroupBy(c => c.AnswerId).ToDictionary(g => g.Key, g => g.ToList());

            // Assign replies to each answer
            foreach (var answer in answers)
            {
                if (commentsByAnswer.TryGetValue(answer.Id, out var replies))
                {
                    answer.Replies = replies;
                }
            }
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

            if (await _socialGuardService.IsBlockedRelation(actorId, recipientId))
            {
                return;
            }

            var actor = await GetProfileSnapshot(actorId);
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.NEW_ANSWER,
                ActorType = ActorType.Profile,
                ActorId = actorId,
                ActorName = actor.Name,
                ActorAvatarUrl = actor.AvatarUrl,
                RecipientId = recipientId,
                EntityType = NotificationEntityType.POST,
                EntityId = answer.QAPost.Id,
                EntityTitle = answer.QAPost.Title,
                EntityPreview = answer.Content?.Substring(0, Math.Min(200, answer.Content?.Length ?? 0)),
                ActionUrl = $"/questions/{answer.QAPostId}#answer-{answerId}"
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.answer"));
        }

        private async Task PublishAcceptAnswerNotificationAsync(string answerId, string actorId)
        {
            var answer = await _dbContext.Answers
                .Include(a => a.QAPost)
                .FirstOrDefaultAsync(a => a.Id == answerId);

            if (answer?.QAPost == null)
            {
                return;
            }

            var recipientId = answer.AuthorId;
            if (string.IsNullOrEmpty(recipientId) || recipientId == actorId)
            {
                return;
            }

            if (await _socialGuardService.IsBlockedRelation(actorId, recipientId))
            {
                return;
            }

            var actor = await GetProfileSnapshot(actorId);
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.ANSWER_ACCEPTED,
                ActorType = ActorType.Profile,
                ActorId = actorId,
                ActorName = actor.Name,
                ActorAvatarUrl = actor.AvatarUrl,
                RecipientId = recipientId,
                EntityType = NotificationEntityType.POST,
                EntityId = answer.QAPost.Id,
                EntityTitle = answer.QAPost.Title,
                EntityPreview = answer.Content?.Substring(0, Math.Min(200, answer.Content?.Length ?? 0)),
                ActionUrl = $"/questions/{answer.QAPostId}#answer-{answerId}"
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.answer"));
        }

        private async Task<(string? Name, string? AvatarUrl)> GetProfileSnapshot(string profileId)
        {
            var profile = await _dbContext.Profiles
                .Where(p => p.Id == profileId)
                .Select(p => new { p.FullName, p.AvatarUrl })
                .FirstOrDefaultAsync();

            return (profile?.FullName, profile?.AvatarUrl);
        }
    }
}
