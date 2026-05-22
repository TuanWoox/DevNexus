using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostTagEntity = platform_core_service.Common.Entities.DbEntities.PostTag;
using TagEntity = platform_core_service.Common.Entities.DbEntities.Tag;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Business.Services
{
    public class QAPostService : IQAPostService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<QAPost, string> _qaPostRepository;
        private readonly IAiWorkerClient _aiWorkerClient;
        private readonly IConfigurationService _configurationService;
        private readonly ISocialGuardService _socialGuardService;
        private readonly IModerationService _moderationService;
        private readonly IContentMediaLinkService _contentMediaLinkService;
        private readonly IQAPostHistoryService _qaPostHistoryService;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public QAPostService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<QAPost, string> qaPostRepository,
            IAiWorkerClient aiWorkerClient,
            IConfigurationService configurationService,
            ISocialGuardService socialGuardService,
            IModerationService moderationService,
            IContentMediaLinkService contentMediaLinkService,
            IQAPostHistoryService qaPostHistoryService,
            IBackgroundJobClient backgroundJobClient
            )
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _qaPostRepository = qaPostRepository;
            _aiWorkerClient = aiWorkerClient;
            _configurationService = configurationService;
            _socialGuardService = socialGuardService;
            _moderationService = moderationService;
            _contentMediaLinkService = contentMediaLinkService;
            _qaPostHistoryService = qaPostHistoryService;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ReturnResult<SelectQAPostDTO>> CreateAsync(CreateQAPostDTO createDTO)
        {
            var result = new ReturnResult<SelectQAPostDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Post data is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                var businessLogicResult = await _socialGuardService.CheckAddingPost(createDTO);
                if (businessLogicResult.Message != null)
                {
                    result.Message = businessLogicResult.Message;
                    return result;
                }

                var matchedBannedKeywords = await GetMatchedBannedKeywordsAsync(createDTO.Title, createDTO.Content);

                // Step 3: Map DTO to entity and set server-side fields
                var qaPost = _mapper.Map<QAPost>(createDTO);
                qaPost.AuthorId = profileId;
                qaPost.Id = Guid.NewGuid().ToString();

                // Step 4: Auto-generate slug, append ID suffix for uniqueness
                if (string.IsNullOrEmpty(qaPost.Slug))
                {
                    var baseSlug = GenerateSlug(qaPost.Title);
                    qaPost.Slug = $"{baseSlug}-{qaPost.Id.Substring(0, 8)}";
                }
                else
                {
                    qaPost.Slug = $"{qaPost.Slug}-{qaPost.Id.Substring(0, 8)}";
                }

                // Step 5: Handle tags
                var postTags = await CreateOrGetTagsAsync(createDTO.TagNames, qaPost.Id);
                qaPost.PostTags = postTags;

                await SetCommunityApprovalStateAsync(qaPost);

                // Step 6: Save
                _dbContext.Posts.Add(qaPost);
                await _dbContext.SaveChangesAsync();

                // Step 7: Link pre-uploaded QA media before returning so media URLs render immediately.
                await _contentMediaLinkService.LinkQAMediaAsync(_userContext.UserId, qaPost.Id, createDTO.MediaIds);

                // Step 8: Reload with relations and return mapped DTO
                var savedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .FirstOrDefaultAsync(q => q.Id == qaPost.Id);

                result.Result = _mapper.Map<SelectQAPostDTO>(savedPost);

                // Step 9: Fire-and-forget — submit to AI moderation pipeline.
                // Runs after response is already built; never blocks or throws to caller.
                // Banned-keyword posts bypass AI and go directly to human review.
                if (matchedBannedKeywords.Any())
                {
                    await _moderationService.EnqueueBannedKeywordReviewAsync(qaPost.Id, matchedBannedKeywords);
                    if (result.Result != null)
                    {
                        result.Result.ModerationStatus = ModerationStatus.InReview;
                        result.Result.ModerationReason = BuildBannedKeywordReason(matchedBannedKeywords);
                    }
                }
                else
                {
                    await _aiWorkerClient.SubmitForModerationAsync(qaPost.Id, createDTO.Title, createDTO.Content);
                }

                await _qaPostHistoryService.RecordHistoryAsync(qaPost.Id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while creating post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectQAPostDTO>> GetByIdAsync(string postId)
        {
            var result = new ReturnResult<SelectQAPostDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(postId))
                {
                    result.Message = "Post ID is required";
                    return result;
                }

                // Step 2: Load with relations (match by Id or Slug)
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .FirstOrDefaultAsync(q => q.Id == postId || q.Slug == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                var accessCheck = await _socialGuardService.CanViewQAPost(qaPost.Id);
                if (!accessCheck.Result)
                {
                    result.Message = accessCheck.Message ?? ResponseMessage.QUESTION_NOT_AVAILABLE;
                    return result;
                }

                result.Result = _mapper.Map<SelectQAPostDTO>(qaPost);
                await SetCurrentUserVoteAsync(result.Result);
                await SetCurrentUserSavedAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPageAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                string currentProfileId = _userContext.ProfileId;

                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .ApplyQAPostVisibilityRules(_dbContext, currentProfileId)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                    await SetCurrentUserSavedForListAsync(result.Result.Data.ToList());
                    await SetCommentCountForListAsync(result.Result.Data.ToList());
                }

            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving posts: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPageAsyncByProfileId(Page<string> page, string profileId)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                string currentProfileId = _userContext.ProfileId;

                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.AuthorId == profileId)
                    .Where(q => q.CommunityId == null)
                    .ApplyQAPostVisibilityRules(_dbContext, currentProfileId)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                    await SetCurrentUserSavedForListAsync(result.Result.Data.ToList());
                    await SetCommentCountForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving posts: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPageAsyncByCommunityId(Page<string> page, string communityId)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Verify the caller has access to this community's content
                var accessCheck = await _socialGuardService.CheckBelongToCommunity(communityId);
                if (accessCheck.Message != null)
                {
                    result.Message = accessCheck.Message;
                    return result;
                }

                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.CommunityId == communityId)
                    .ApplyQAPostVisibilityRules(_dbContext, _userContext.ProfileId)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                    await SetCurrentUserSavedForListAsync(result.Result.Data.ToList());
                    await SetCommentCountForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving community Q&A posts: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectQAPostDTO>> ApproveCommunityPostAsync(string postId)
        {
            var result = new ReturnResult<SelectQAPostDTO>();
            try
            {
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                if (string.IsNullOrEmpty(qaPost.CommunityId))
                {
                    result.Message = "Only community questions can be approved";
                    return result;
                }

                var permission = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(_userContext.ProfileId, qaPost.CommunityId);
                if (!permission.Result)
                {
                    result.Message = permission.Message ?? "You do not have permission to approve this question";
                    return result;
                }

                var wasAlreadyApproved = qaPost.CommunityApprovalStatus == CommunityApprovalStatus.Approved;
                qaPost.CommunityApprovalStatus = CommunityApprovalStatus.Approved;
                qaPost.CommunityApprovalReason = null;
                await _dbContext.SaveChangesAsync();
                if (!wasAlreadyApproved)
                {
                    await EnqueueContentApprovedNotification(qaPost);
                }

                result.Result = _mapper.Map<SelectQAPostDTO>(qaPost);
                await SetCurrentUserVoteAsync(result.Result);
                await SetCurrentUserSavedAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while approving question: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectQAPostDTO>> RejectCommunityPostAsync(string postId, string? reason)
        {
            var result = new ReturnResult<SelectQAPostDTO>();
            try
            {
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                if (string.IsNullOrEmpty(qaPost.CommunityId))
                {
                    result.Message = "Only community questions can be rejected";
                    return result;
                }

                var permission = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(_userContext.ProfileId, qaPost.CommunityId);
                if (!permission.Result)
                {
                    result.Message = permission.Message ?? "You do not have permission to reject this question";
                    return result;
                }

                qaPost.CommunityApprovalStatus = CommunityApprovalStatus.Rejected;
                qaPost.CommunityApprovalReason = NormalizeCommunityApprovalReason(reason, "Rejected by a community moderator");
                await _dbContext.SaveChangesAsync();

                result.Result = _mapper.Map<SelectQAPostDTO>(qaPost);
                await SetCurrentUserVoteAsync(result.Result);
                await SetCurrentUserSavedAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while rejecting question: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPendingPostsByCommunityIdAsync(Page<string> page, string communityId)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                var permission = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(_userContext.ProfileId, communityId);
                if (!permission.Result)
                {
                    result.Message = permission.Message ?? "You do not have permission to view pending questions";
                    return result;
                }

                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.CommunityId == communityId)
                    .Where(q => q.ModerationStatus == ModerationStatus.Approved)
                    .Where(q => q.CommunityApprovalStatus == CommunityApprovalStatus.Pending)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCommentCountForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving pending questions: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetMyPendingPostsByCommunityIdAsync(Page<string> page, string communityId)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                var accessCheck = await _socialGuardService.CheckBelongToCommunity(communityId);
                if (accessCheck.Message != null)
                {
                    result.Message = accessCheck.Message;
                    return result;
                }

                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.CommunityId == communityId)
                    .Where(q => q.AuthorId == _userContext.ProfileId)
                    .Where(q => q.ModerationStatus == ModerationStatus.Approved)
                    .Where(q => q.CommunityApprovalStatus == CommunityApprovalStatus.Pending ||
                                q.CommunityApprovalStatus == CommunityApprovalStatus.Rejected)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCommentCountForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving your pending questions: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectQAPostDTO>> UpdateAsync(UpdateQAPostDTO updateDTO)
        {
            var result = new ReturnResult<SelectQAPostDTO>();
            try
            {
                // Step 1: Validate input
                if (updateDTO == null || string.IsNullOrEmpty(updateDTO.Id))
                {
                    result.Message = "Update data with valid ID is required";
                    return result;
                }

                var postId = updateDTO.Id;

                // Step 2: Load entity with relations
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (qaPost.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to update this post";
                    return result;
                }

                // Step 3b: If CommunityId is provided, validate user belongs to that community
                if (!string.IsNullOrEmpty(updateDTO.CommunityId))
                {
                    var communityCheck = await _socialGuardService.CheckBelongToCommunity(updateDTO.CommunityId);
                    if (communityCheck.Message != null)
                    {
                        result.Message = communityCheck.Message;
                        return result;
                    }
                }

                // Step 4: Apply DTO to entity
                var oldSlug = qaPost.Slug;
                _mapper.Map(updateDTO, qaPost);

                // Step 5: Preserve slug uniqueness
                if (!string.IsNullOrEmpty(updateDTO.Slug) && !updateDTO.Slug.Contains(postId.Substring(0, 8)))
                {
                    qaPost.Slug = $"{updateDTO.Slug}-{postId.Substring(0, 8)}";
                }
                else
                {
                    qaPost.Slug = oldSlug;
                }

                // Step 6: Sync tags if provided
                if (updateDTO.TagNames != null)
                {
                    await UpdatePostTagsAsync(qaPost, updateDTO.TagNames, postId);
                }

                var shouldModerate = !string.IsNullOrWhiteSpace(updateDTO.Content) || !string.IsNullOrWhiteSpace(updateDTO.Title);

                // Step 7: Save
                _dbContext.Posts.Update(qaPost);
                await _dbContext.SaveChangesAsync();

                // Step 8: Link any newly provided pre-uploaded QA media before returning.
                await _contentMediaLinkService.LinkQAMediaAsync(_userContext.UserId, postId, updateDTO.MediaIds);

                // Step 9: Reset and re-submit for moderation.
                // Edited content must pass the pipeline again before becoming visible.
                if (shouldModerate)
                {
                    var matchedBannedKeywords = await GetMatchedBannedKeywordsAsync(qaPost.Title, qaPost.Content);

                    if (matchedBannedKeywords.Any())
                    {
                        await _moderationService.EnqueueBannedKeywordReviewAsync(postId, matchedBannedKeywords);
                    }
                    else
                    {
                        qaPost.ModerationStatus = ModerationStatus.Pending;
                        qaPost.ModerationReason = null;
                        await _dbContext.SaveChangesAsync();
                        await _aiWorkerClient.SubmitForModerationAsync(postId, qaPost.Title, qaPost.Content);
                    }
                }

                await _qaPostHistoryService.RecordHistoryAsync(postId);

                // Step 10: Reload after moderation changes so response matches persisted state
                var updatedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .Include(q => q.Community)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                result.Result = _mapper.Map<SelectQAPostDTO>(updatedPost);
                await SetCurrentUserVoteAsync(result.Result);
                await SetCurrentUserSavedAsync(result.Result);

            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> DeleteByIdAsync(string postId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(postId))
                {
                    result.Message = "Post ID is required";
                    return result;
                }

                // Step 2: Load entity
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.PostTags)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                // Step 3: Check ownership or community moderation permissions
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                if (!string.IsNullOrEmpty(qaPost.CommunityId))
                {
                    var isModerator = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(profileId, qaPost.CommunityId);
                    if (qaPost.AuthorId != profileId && !isModerator.Result)
                    {
                        result.Message = "You do not have permission to delete this post";
                        return result;
                    }
                }
                else if (qaPost.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to delete this post";
                    return result;
                }

                // Step 4: Delete
                _dbContext.Posts.Remove(qaPost);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting post: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<int>> DeleteManyAsync(List<string> ids)
        {
            var result = new ReturnResult<int>();
            try
            {
                // Step 1: Validate IDs
                if (ids == null || !ids.Any())
                {
                    result.Message = "Post IDs are required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Validate all IDs belong to current user (in-service ownership check before deletion)
                var ownedCount = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => ids.Contains(q.Id) && q.AuthorId == profileId)
                    .CountAsync();

                if (ownedCount != ids.Count)
                {
                    result.Message = "Some posts do not belong to you or have already been deleted";
                    return result;
                }

                // Step 4: Delete all
                var postsToDelete = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => ids.Contains(q.Id))
                    .ToListAsync();

                _dbContext.Posts.RemoveRange(postsToDelete);
                await _dbContext.SaveChangesAsync();

                result.Result = postsToDelete.Count;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting posts: {ex.Message}";
                result.Result = 0;
            }
            return result;
        }

        // ── Private helpers ────────────────────────────────────────────────────

        private async Task<List<string>> GetBannedKeywordsAsync()
        {
            var settingResult = await _configurationService.GetOneByKeyAndGroup("BannedKeywords", "Moderation");
            if (settingResult.Result == null || string.IsNullOrEmpty(settingResult.Result.Value))
                return new List<string>();
            try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(settingResult.Result.Value) ?? new List<string>(); }
            catch { return new List<string>(); }
        }

        private async Task<List<string>> GetMatchedBannedKeywordsAsync(string? title, string? content)
        {
            var bannedKeywords = await GetBannedKeywordsAsync();
            return bannedKeywords
                .Where(k => !string.IsNullOrWhiteSpace(k) && (
                    (content ?? "").Contains(k, StringComparison.OrdinalIgnoreCase) ||
                    (title ?? "").Contains(k, StringComparison.OrdinalIgnoreCase)
                ))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string BuildBannedKeywordReason(IReadOnlyCollection<string> matchedKeywords)
        {
            var keywordPreview = matchedKeywords.Where(k => !string.IsNullOrWhiteSpace(k)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var reason = keywordPreview.Any()
                ? $"Banned keywords detected: {string.Join(", ", keywordPreview)}"
                : "Banned keywords detected.";
            return reason.Length <= 1000 ? reason : reason[..1000];
        }

        private Task EnqueueContentApprovedNotification(QAPost qaPost)
        {
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.CONTENT_APPROVED,
                ActorType = ActorType.Community,
                ActorId = qaPost.CommunityId,
                ActorName = qaPost.Community?.Name,
                ActorAvatarUrl = qaPost.Community?.CommunityCoverPhotoUrl,
                RecipientId = qaPost.AuthorId,
                EntityType = NotificationEntityType.QUESTION,
                EntityId = qaPost.Id,
                EntityTitle = qaPost.Title,
                EntityPreview = qaPost.Content?.Length > 100 ? qaPost.Content[..100] : qaPost.Content,
                ActionUrl = $"/questions/{qaPost.Id}",
                Timestamp = DateTime.UtcNow,
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.community"));

            return Task.CompletedTask;
        }

        private async Task SetCommunityApprovalStateAsync(QAPost qaPost)
        {
            if (string.IsNullOrEmpty(qaPost.CommunityId))
            {
                qaPost.CommunityApprovalStatus = null;
                qaPost.CommunityApprovalReason = null;
                return;
            }

            var requireApproval = await _dbContext.Communities
                .AsNoTracking()
                .Where(c => c.Id == qaPost.CommunityId)
                .Select(c => c.RequireContentApproval)
                .FirstOrDefaultAsync();

            qaPost.CommunityApprovalStatus = requireApproval
                ? CommunityApprovalStatus.Pending
                : CommunityApprovalStatus.Approved;
            qaPost.CommunityApprovalReason = requireApproval
                ? "Awaiting moderator approval"
                : null;
        }

        private static string NormalizeCommunityApprovalReason(string? reason, string fallback)
        {
            var value = string.IsNullOrWhiteSpace(reason) ? fallback : reason.Trim();
            return value.Length <= 1000 ? value : value[..1000];
        }

        private string GenerateSlug(string title)
        {
            if (string.IsNullOrEmpty(title)) return Guid.NewGuid().ToString().Substring(0, 8);

            return title
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("--", "-");
        }

        private async Task<List<PostTagEntity>> CreateOrGetTagsAsync(List<string> tagNames, string postId)
        {
            var postTags = new List<PostTagEntity>();

            if (tagNames == null || !tagNames.Any())
                return postTags;

            // Step 1: Clean up the tag list (remove null/empty strings and duplicates)
            var distinctTagNames = tagNames
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct()
                .ToList();

            if (!distinctTagNames.Any())
                return postTags;

            // Step 2: Fetch all existing tags from the database in a single query (Batching)
            var existingTags = await _dbContext.Tags
                .Where(t => distinctTagNames.Contains(t.Name))
                .ToListAsync();

            // Convert to a Dictionary for O(1) lookup performance
            var tagsByName = existingTags.ToDictionary(t => t.Name, t => t);

            // Step 3: Identify missing tags that need to be created
            var missingTagNames = distinctTagNames.Except(tagsByName.Keys).ToList();

            if (missingTagNames.Any())
            {
                // Prepare the list of new tags
                var newTags = missingTagNames.Select(name => new TagEntity { Name = name }).ToList();

                // Add all new tags to the DbContext
                _dbContext.Tags.AddRange(newTags);

                // Execute a single database write for all new tags (Batch Insert)
                await _dbContext.SaveChangesAsync();

                // EF Core automatically populates the Ids for newTags after SaveChangesAsync.
                // Add these newly created tags to our lookup dictionary.
                foreach (var tag in newTags)
                {
                    tagsByName[tag.Name] = tag;
                }
            }

            // Step 4: Create the PostTag junction entities
            foreach (var tagName in distinctTagNames)
            {
                if (tagsByName.TryGetValue(tagName, out var tag))
                {
                    postTags.Add(new PostTagEntity { PostId = postId, TagId = tag.Id });
                }
            }

            return postTags;
        }

        private async Task UpdatePostTagsAsync(QAPost qaPost, List<string> newTagNames, string postId)
        {
            var oldTagNames = qaPost.PostTags.Select(pt => pt.Tag.Name).ToList();
            var cleanNewTagNames = newTagNames.Where(t => !string.IsNullOrEmpty(t)).Distinct().ToList();

            var tagsToRemove = oldTagNames.Except(cleanNewTagNames).ToList();
            if (tagsToRemove.Any())
            {
                var postTagsToRemove = qaPost.PostTags.Where(pt => tagsToRemove.Contains(pt.Tag.Name)).ToList();
                _dbContext.PostTags.RemoveRange(postTagsToRemove);
                qaPost.PostTags = qaPost.PostTags.Except(postTagsToRemove).ToList();
            }

            var tagsToAdd = cleanNewTagNames.Except(oldTagNames).ToList();
            if (tagsToAdd.Any())
            {
                var newPostTags = await CreateOrGetTagsAsync(tagsToAdd, postId);
                foreach (var tag in newPostTags)
                {
                    qaPost.PostTags.Add(tag);
                }
            }
        }
        private async Task SetCurrentUserVotesForListAsync(List<SelectQAPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var votes = await _dbContext.Votes
                .Where(v => v.AuthorId == profileId && postIds.Contains(v.PostId))
                .Select(v => new { v.PostId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes.ToDictionary(v => v.PostId, v => (bool?)v.IsUpvote);

            foreach (var dto in dtos)
            {
                dto.CurrentUserVote = voteMap.TryGetValue(dto.Id, out var vote) ? vote : null;
            }
        }
        private async Task SetCommentCountForListAsync(List<SelectQAPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var comments = await _dbContext.Comments
                .Where(c => c.PostId != null && postIds.Contains(c.PostId))
                .GroupBy(c => c.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId!, x => x.Count);

            foreach (var dto in dtos)
            {
                dto.CommentCount = comments.TryGetValue(dto.Id, out var count) ? count : 0;
            }
        }
        private async Task SetCurrentUserVoteAsync(SelectQAPostDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var vote = await _dbContext.Votes
                .Where(v => v.AuthorId == profileId && v.PostId == dto.Id)
                .Select(v => (bool?)v.IsUpvote)
                .FirstOrDefaultAsync();

            dto.CurrentUserVote = vote;
        }

        private async Task SetCurrentUserSavedForListAsync(List<SelectQAPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var savedItems = await _dbContext.BookMarkedItems
                .Include(b => b.BookMark)
                .Where(b => b.BookMark.OwnerId == profileId && postIds.Contains(b.QAPostId))
                .Select(b => new { b.QAPostId, b.Id })
                .ToListAsync();

            var savedMap = savedItems
                .Where(x => x.QAPostId != null)
                .GroupBy(b => b.QAPostId)
                .ToDictionary(g => g.Key, g => g.First().Id);

            foreach (var dto in dtos)
            {
                if (savedMap.TryGetValue(dto.Id, out var bookMarkedItemId))
                {
                    dto.IsSaved = true;
                    dto.SavedBookMarkedItemId = bookMarkedItemId;
                }
                else
                {
                    dto.IsSaved = false;
                }
            }
        }

        private async Task SetCurrentUserSavedAsync(SelectQAPostDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var savedItem = await _dbContext.BookMarkedItems
                .Include(b => b.BookMark)
                .Where(b => b.BookMark.OwnerId == profileId && b.QAPostId == dto.Id)
                .Select(b => b.Id)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(savedItem))
            {
                dto.IsSaved = true;
                dto.SavedBookMarkedItemId = savedItem;
            }
            else
            {
                dto.IsSaved = false;
            }
        }
    }
}
