using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostTagEntity = platform_core_service.Common.Entities.DbEntities.PostTag;
using TagEntity = platform_core_service.Common.Entities.DbEntities.Tag;
using platform_core_service.Common.Utils.Enums;
using Hangfire;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Business.Services
{
    public class QAPostService : IQAPostService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<QAPost, string> _qaPostRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IAiWorkerClient _aiWorkerClient;

        public QAPostService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<QAPost, string> qaPostRepository,
            IBackgroundJobClient backgroundJobClient,
            IAiWorkerClient aiWorkerClient
            )
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _qaPostRepository = qaPostRepository;
            _backgroundJobClient = backgroundJobClient;
            _aiWorkerClient = aiWorkerClient;
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

                // Step 6: Save
                _dbContext.Posts.Add(qaPost);
                await _dbContext.SaveChangesAsync();

                // Step 7: Link pre-uploaded QA media (upload-first flow)
                if(createDTO.MediaIds.Count > 0 ) _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x => x.UpdateQAPostMediaQAPostId(_userContext.UserId, qaPost.Id, createDTO.MediaIds));

                // Step 8: Reload with relations and return mapped DTO
                var savedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .FirstOrDefaultAsync(q => q.Id == qaPost.Id);

                result.Result = _mapper.Map<SelectQAPostDTO>(savedPost);

                // Step 9: Fire-and-forget — submit to AI moderation pipeline.
                // Runs after response is already built; never blocks or throws to caller.
                await _aiWorkerClient.SubmitForModerationAsync(qaPost.Id, createDTO.Content);
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

                // Step 2: Load with relations (match by Id or Slug — public read, no ownership check)
                var qaPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .FirstOrDefaultAsync(q =>
                        (q.Id == postId || q.Slug == postId)
                        && q.ModerationStatus == ModerationStatus.Approved);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectQAPostDTO>(qaPost);
                await SetCurrentUserVoteAsync(result.Result);
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
                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.ModerationStatus == ModerationStatus.Approved)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .AsQueryable();

                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
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

                // Step 7: Save
                _dbContext.Posts.Update(qaPost);
                await _dbContext.SaveChangesAsync();

                // Step 8: Link any newly provided pre-uploaded QA media
                if (updateDTO.MediaIds?.Count > 0) _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x => x.UpdateQAPostMediaQAPostId(_userContext.UserId, postId, updateDTO.MediaIds));

                // Step 9: Reload and return
                var updatedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .Include(q => q.Author)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                result.Result = _mapper.Map<SelectQAPostDTO>(updatedPost);
                await SetCurrentUserVoteAsync(result.Result);

                // Step 10: Reset to Pending and re-submit for moderation.
                // Edited content must pass the pipeline again before becoming visible.
                if (!string.IsNullOrWhiteSpace(updateDTO.Content))
                {
                    qaPost.ModerationStatus = ModerationStatus.Pending;
                    await _dbContext.SaveChangesAsync();
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

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (qaPost.AuthorId != profileId)
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
    }
}