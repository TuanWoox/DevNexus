using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Linq.Dynamic.Core;
using System.Text.RegularExpressions;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;
using PostTagEntity = platform_core_service.Common.Entities.DbEntities.PostTag;
using TagEntity = platform_core_service.Common.Entities.DbEntities.Tag;

namespace platform_core_service.Business.Services
{
    public class PostService : IPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IRepository<PostEntity, string> _postRepository;
        private readonly ISocialGuardService _socialGuardService;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IAiWorkerClient _aiWorkerClient;
        private readonly IConfigurationService _configurationService;

        public PostService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserContext userContext,
            IRepository<PostEntity, string> postRepository,
            ISocialGuardService socialGuardService,
            IBackgroundJobClient backgroundJobClient,
            IAiWorkerClient aiWorkerClient,
            IConfigurationService configurationService
        )
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _postRepository = postRepository;
            _socialGuardService = socialGuardService;
            _backgroundJobClient = backgroundJobClient;
            _aiWorkerClient = aiWorkerClient;
            _configurationService = configurationService;
        }

        public async Task<ReturnResult<SelectPostDTO>> CreateAsync(CreatePostDTO createDTO)
        {
            var result = new ReturnResult<SelectPostDTO>();
            try
            {
                var businessLogicResult = await _socialGuardService.CheckAddingPost(createDTO);
                if (businessLogicResult.Message != null)
                {
                    result.Message = businessLogicResult.Message;
                    return result;
                }

                // Keyword filter: posts with banned keywords skip AI submission (stay Pending for human review)
                var bannedKeywords = await GetBannedKeywordsAsync();
                bool hasBannedKeyword = bannedKeywords.Any(k =>
                    !string.IsNullOrEmpty(k) && (
                        (createDTO.Content ?? "").Contains(k, StringComparison.OrdinalIgnoreCase) ||
                        (createDTO.Title ?? "").Contains(k, StringComparison.OrdinalIgnoreCase)
                    ));

                // Step 3: Map DTO to entity
                var post = _mapper.Map<PostEntity>(createDTO);
                post.AuthorId = _userContext.ProfileId;
                post.Id = Guid.NewGuid().ToString();

                // Step 4: Auto-generate slug if not provided, append post ID for uniqueness
                if (string.IsNullOrEmpty(post.Slug))
                {
                    var baseSlug = GenerateSlug(post.Title);
                    post.Slug = $"{baseSlug}-{post.Id.Substring(0, 8)}";
                }
                else
                {
                    // Append post ID to user-provided slug for guaranteed uniqueness
                    post.Slug = $"{post.Slug}-{post.Id.Substring(0, 8)}";
                }

                // Step 5: Handle tags
                var postTags = await CreateOrGetTagsAsync(createDTO.TagNames, post.Id);
                post.PostTags = postTags;

                // Step 6: Save post — ModerationStatus defaults to Pending (set in entity)
                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                // Step 7: Link pre-uploaded media (upload-first flow)
                if (createDTO.MediaIds.Count > 0) _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x => x.UpdatePostMediaPostId(_userContext.UserId, post.Id, createDTO.MediaIds));

                // Step 8: Return mapped DTO
                var savedPost = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .FirstOrDefaultAsync(p => p.Id == post.Id);

                result.Result = _mapper.Map<SelectPostDTO>(savedPost);

                // Step 8: Fire-and-forget — submit to AI moderation pipeline.
                // Runs after response is already built; never blocks or throws to caller.
                // Skip AI submission for banned-keyword posts — they stay Pending for human review.
                if (!hasBannedKeyword)
                    await _aiWorkerClient.SubmitForModerationAsync(post.Id, createDTO.Content);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while creating post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectPostDTO>> GetByIdAsync(string postId)
        {
            var returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(postId))
                {
                    returnResult.Message = "Post ID is required";
                    return returnResult;
                }
                bool hasPrivilegedAccess = _userContext.IsAdmin || _userContext.IsModerator;

                // Step 2: Load post with tags and author (public read)
                var query = _context.Posts
                    .Include(p => p.PostTags)
                        .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .Where(p => p.Id == postId || p.Slug == postId);

                // Apply ModerationStatus filter ONLY if the user is a standard user
                if (!hasPrivilegedAccess)
                {
                    query = query.Where(p => p.ModerationStatus == ModerationStatus.Approved);
                }

                var post = await query.FirstOrDefaultAsync();

                if (post == null)
                {
                    returnResult.Message = $"Post {postId} not found";
                    return returnResult;
                }

                if (!hasPrivilegedAccess)
                {
                    var accessCheck = await _socialGuardService.CheckVisibleContent(post.AuthorId, post.CommunityId);

                    if (!accessCheck.Result)
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                        return returnResult;
                    }
                }

                returnResult.Result = _mapper.Map<SelectPostDTO>(post);
                await SetCurrentUserVoteAsync(returnResult.Result);
                await SetCurrentUserSavedAsync(returnResult.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while retrieving post: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<SelectPostDTO>> GetByIdAndCommunityId(string postId, string communityId)
        {
            ReturnResult<SelectPostDTO> returnResult = new ReturnResult<SelectPostDTO>();
            try
            {
                var post = await _context.Posts
                                            .Include(p => p.PostTags)
                                            .ThenInclude(pt => pt.Tag)
                                            .Include(p => p.Author)
                                            .Include(p => p.Community)
                                            .FirstOrDefaultAsync(p => p.Id == postId || p.Slug == postId && p.CommunityId == communityId);
                if (post == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "post", postId);
                    return returnResult;
                }

                var accessCheck = await _socialGuardService.CheckVisibleContent(post.AuthorId, post.CommunityId);

                if (!accessCheck.Result)
                {
                    returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                    return returnResult;
                }

                returnResult.Result = _mapper.Map<SelectPostDTO>(post);
                await SetCurrentUserVoteAsync(returnResult.Result);
                await SetCurrentUserSavedAsync(returnResult.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while retrieving post: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                string currentProfileId = _userContext.ProfileId;

                // Step 2: Build query — news feed shows only approved posts for all users
                var query = _context.Posts
                    .Where(p => p.GetType() == typeof(PostEntity))
                    .Where(p =>
                        p.CommunityId == null || // Post not belonging to any community
                        !p.Community.IsPrivate && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId) || // Public community, not banned
                        p.Community.OwnerId == currentProfileId || // User is the community's owner
                        p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) || // User is Moderator
                        p.Community.Members.Any(m => m.ProfileId == currentProfileId) && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId) // User is Member, not banned
                    )
                    .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _postRepository.GetPagingAsync<Page<string>, SelectPostDTO>(query, page);
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
        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsyncByProfileId(Page<string> page, string profileId)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                // Step 1: Get current user profile
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                string currentProfileId = _userContext.ProfileId;

                // Step 2: Build query — only concrete Post rows (exclude QAPost subtype)
                var query = _context.Posts
                    .Where(p => p.GetType() == typeof(PostEntity))
                    .Where(p =>
                        p.CommunityId == null ||
                        !p.Community.IsPrivate && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId) ||
                        p.Community.OwnerId == currentProfileId ||
                        p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                        p.Community.Members.Any(m => m.ProfileId == currentProfileId) && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId)
                    )
                    .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                    .Where(p => p.AuthorId == profileId)
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _postRepository.GetPagingAsync<Page<string>, SelectPostDTO>(query, page);
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

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsyncByCommunityId(Page<string> page, string communityId)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
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

                var query = _context.Posts
                    .Where(p => p.GetType() == typeof(PostEntity))
                    .Where(p => p.CommunityId == communityId)
                    .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _postRepository.GetPagingAsync<Page<string>, SelectPostDTO>(query, page);
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
                result.Message = $"An error occurred while retrieving community posts: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPostAndQAByProfileId(Page<string> page, string profileId)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                // Step 1: Get current user profile
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                string currentProfileId = _userContext.ProfileId;

                // Step 2: Build query — only concrete Post rows (exclude QAPost subtype)
                var query = _context.Posts
                    .Where(p =>
                        p.CommunityId == null ||
                        !p.Community.IsPrivate && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId) ||
                        p.Community.OwnerId == currentProfileId ||
                        p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                        p.Community.Members.Any(m => m.ProfileId == currentProfileId) && !p.Community.Bans.Any(b => b.BannedProfileId == currentProfileId)
                    )
                    .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                    .Where(p => p.AuthorId == profileId)
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _postRepository.GetPagingAsync<Page<string>, SelectPostDTO>(query, page);
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

        public async Task<ReturnResult<SelectPostDTO>> UpdateAsync(UpdatePostDTO updateDTO)
        {
            var result = new ReturnResult<SelectPostDTO>();
            try
            {
                // Step 1: Validate inputs
                if (updateDTO == null || string.IsNullOrEmpty(updateDTO.Id))
                {
                    result.Message = "Update data with valid ID is required";
                    return result;
                }

                var postId = updateDTO.Id;

                // Step 2: Load post
                var post = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (post.AuthorId != profileId)
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

                // Step 4: Update basic fields
                var oldSlug = post.Slug;
                _mapper.Map(updateDTO, post);

                // Step 5: Handle slug if provided
                if (!string.IsNullOrEmpty(updateDTO.Slug) && !updateDTO.Slug.Contains(postId.Substring(0, 8)))
                {
                    // Append post ID to slug for guaranteed uniqueness
                    post.Slug = $"{updateDTO.Slug}-{postId.Substring(0, 8)}";
                }
                else post.Slug = oldSlug;

                // Step 6: Handle tags if provided - only add/remove differences
                if (updateDTO.TagNames != null)
                {
                    await UpdatePostTagsAsync(post, updateDTO.TagNames, postId);
                }

                // Step 7: Save changes
                _context.Posts.Update(post);
                await _context.SaveChangesAsync();

                // Step 8: Link any newly provided pre-uploaded media
                if (updateDTO.MediaIds?.Count > 0) _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x => x.UpdatePostMediaPostId(_userContext.UserId, postId, updateDTO.MediaIds));

                // Step 9: Reload and return
                var updatedPost = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                result.Result = _mapper.Map<SelectPostDTO>(updatedPost);
                await SetCurrentUserVoteAsync(result.Result);
                await SetCurrentUserSavedAsync(result.Result);

                // Step 10: Reset to Pending and re-submit for moderation.
                // Edited content must pass the pipeline again before becoming visible.
                // Banned-keyword check: posts with banned keywords skip AI submission (stay Pending for human review).
                if (!string.IsNullOrWhiteSpace(updateDTO.Content))
                {
                    var bannedKeywords = await GetBannedKeywordsAsync();
                    bool hasBannedKeyword = bannedKeywords.Any(k =>
                        !string.IsNullOrEmpty(k) && (
                            (updateDTO.Content ?? "").Contains(k, StringComparison.OrdinalIgnoreCase) ||
                            (updateDTO.Title ?? "").Contains(k, StringComparison.OrdinalIgnoreCase)
                        ));

                    post.ModerationStatus = ModerationStatus.Pending;
                    await _context.SaveChangesAsync();

                    if (!hasBannedKeyword)
                        await _aiWorkerClient.SubmitForModerationAsync(postId, updateDTO.Content);
                }
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

                // Step 2: Load post
                var post = await _context.Posts.Include(p => p.PostTags)
                                            .FirstOrDefaultAsync(p => p.Id == postId);
                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (post.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to delete this post";
                    return result;
                }

                // Step 4: Soft delete
                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();

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

        public async Task<ReturnResult<int>> DeleteByIdsAsync(List<string> postIds)
        {
            var result = new ReturnResult<int>();
            try
            {
                // Step 1: Validate input
                if (postIds == null || !postIds.Any())
                {
                    result.Message = "Post IDs are required";
                    return result;
                }

                // Step 2: Get current user profile
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Validate all IDs belong to current user
                var ownedCount = await _context.Posts.Where(p => postIds.Contains(p.Id) && p.AuthorId == profileId)
                                                .CountAsync();

                if (ownedCount != postIds.Count)
                {
                    result.Message = "Some posts do not belong to you or have already been deleted";
                    return result;
                }

                // Step 4: Soft delete all posts
                var postsToDelete = await _context.Posts
                    .Where(p => postIds.Contains(p.Id))
                    .ToListAsync();

                _context.Posts.RemoveRange(postsToDelete);
                await _context.SaveChangesAsync();

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

        private async Task<List<string>> GetBannedKeywordsAsync()
        {
            var settingResult = await _configurationService.GetOneByKeyAndGroup("BannedKeywords", "Moderation");
            if (settingResult.Result == null || string.IsNullOrEmpty(settingResult.Result.Value))
                return new List<string>();
            try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(settingResult.Result.Value) ?? new List<string>(); }
            catch { return new List<string>(); }
        }

        // Helper method to generate slug from title
        private string GenerateSlug(string title)
        {
            if (string.IsNullOrEmpty(title)) return Guid.NewGuid().ToString().Substring(0, 8);

            var slug = title
                .ToLower()
                .Trim()
                .Replace(" ", "-");

            return Regex.Replace(slug, "-+", "-");
        }

        // Helper method to create or get tags
        private async Task<List<PostTagEntity>> CreateOrGetTagsAsync(List<string> tagNames, string postId)
        {
            var postTags = new List<PostTagEntity>();

            if (tagNames == null || !tagNames.Any())
                return postTags;

            foreach (var tagName in tagNames.Where(t => !string.IsNullOrEmpty(t)).Distinct())
            {
                // Find or create tag
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName);

                if (tag == null)
                {
                    tag = new TagEntity
                    {
                        Name = tagName
                    };
                    _context.Tags.Add(tag);
                    await _context.SaveChangesAsync();
                }

                // Create PostTag relationship
                var postTag = new PostTagEntity
                {
                    PostId = postId,
                    TagId = tag.Id
                };
                postTags.Add(postTag);
            }

            return postTags;
        }

        // Helper method to update post tags (add new, remove old, keep unchanged)
        private async Task UpdatePostTagsAsync(PostEntity post, List<string> newTagNames, string postId)
        {
            var oldTagNames = post.PostTags.Select(pt => pt.Tag.Name).ToList();
            var cleanNewTagNames = newTagNames.Where(t => !string.IsNullOrEmpty(t)).Distinct().ToList();

            // Find tags to remove (in old but not in new)
            var tagsToRemove = oldTagNames.Except(cleanNewTagNames).ToList();
            if (tagsToRemove.Any())
            {
                var postTagsToRemove = post.PostTags.Where(pt => tagsToRemove.Contains(pt.Tag.Name)).ToList();
                _context.PostTags.RemoveRange(postTagsToRemove);
                post.PostTags = post.PostTags.Except(postTagsToRemove).ToList();
            }

            // Find tags to add (in new but not in old)
            var tagsToAdd = cleanNewTagNames.Except(oldTagNames).ToList();
            if (tagsToAdd.Any())
            {
                var newPostTags = await CreateOrGetTagsAsync(tagsToAdd, postId);
                foreach (var tag in newPostTags)
                {
                    post.PostTags.Add(tag);
                }
            }
        }
        private async Task SetCurrentUserVotesForListAsync(List<SelectPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var votes = await _context.Votes
                .Where(v => v.AuthorId == profileId && postIds.Contains(v.PostId))
                .Select(v => new { v.PostId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes.ToDictionary(v => v.PostId, v => (bool?)v.IsUpvote);

            foreach (var dto in dtos)
            {
                dto.CurrentUserVote = voteMap.TryGetValue(dto.Id, out var vote) ? vote : null;
            }
        }
        private async Task SetCommentCountForListAsync(List<SelectPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var comments = await _context.Comments
                .Where(c => c.PostId != null && postIds.Contains(c.PostId))
                .GroupBy(c => c.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId!, x => x.Count);

            foreach (var dto in dtos)
            {
                dto.CommentCount = comments.TryGetValue(dto.Id, out var count) ? count : 0;
            }
        }
        private async Task SetCurrentUserVoteAsync(SelectPostDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var vote = await _context.Votes
                .Where(v => v.AuthorId == profileId && v.PostId == dto.Id)
                .Select(v => (bool?)v.IsUpvote)
                .FirstOrDefaultAsync();

            dto.CurrentUserVote = vote;
        }

        private async Task SetCurrentUserSavedForListAsync(List<SelectPostDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var postIds = dtos.Select(s => s.Id).ToList();

            var savedItems = await _context.BookMarkedItems
                .Include(b => b.BookMark)
                .Where(b => b.BookMark.OwnerId == profileId && (postIds.Contains(b.PostId) || postIds.Contains(b.QAPostId)))
                .Select(b => new { b.PostId, b.QAPostId, b.Id })
                .ToListAsync();

            var savedMap = savedItems
                .Where(x => x.PostId != null || x.QAPostId != null)
                .GroupBy(b => b.PostId ?? b.QAPostId!)
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

        private async Task SetCurrentUserSavedAsync(SelectPostDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var savedItem = await _context.BookMarkedItems
                .Include(b => b.BookMark)
                .Where(b => b.BookMark.OwnerId == profileId && (b.PostId == dto.Id || b.QAPostId == dto.Id))
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
