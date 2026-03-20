using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using shared_contracts.Models.DTOs.HelperDTO;
using PostTagEntity = platform_core_service.Common.Entities.DbEntities.PostTag;
using TagEntity = platform_core_service.Common.Entities.DbEntities.Tag;

namespace platform_core_service.Business.Services
{
    public class QAPostService : IQAPostService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<QAPost, string> _qaPostRepository;

        public QAPostService(
            ApplicationDbContext dbContext,
            IUserContext userContext,
            IMapper mapper,
            IRepository<QAPost, string> qaPostRepository)
        {
            _dbContext = dbContext;
            _userContext = userContext;
            _mapper = mapper;
            _qaPostRepository = qaPostRepository;
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

                // Step 7: Reload with relations and return mapped DTO
                var savedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(q => q.Id == qaPost.Id);

                result.Result = _mapper.Map<SelectQAPostDTO>(savedPost);
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
                    .FirstOrDefaultAsync(q => q.Id == postId || q.Slug == postId);

                if (qaPost == null)
                {
                    result.Message = $"QAPost {postId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectQAPostDTO>(qaPost);
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
                // Step 1: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 2: Build query for current user's QA posts
                var query = _dbContext.Posts
                    .OfType<QAPost>()
                    .Where(q => q.AuthorId == profileId)
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .AsQueryable();

                // Step 3: Delegate paging to repository
                result.Result = await _qaPostRepository.GetPagingAsync<Page<string>, SelectQAPostDTO>(query, page);
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

                // Step 8: Reload and return
                var updatedPost = await _dbContext.Posts
                    .OfType<QAPost>()
                    .Include(q => q.Answers)
                    .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(q => q.Id == postId);

                result.Result = _mapper.Map<SelectQAPostDTO>(updatedPost);
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

            foreach (var tagName in tagNames.Where(t => !string.IsNullOrEmpty(t)).Distinct())
            {
                var tag = await _dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName);

                if (tag == null)
                {
                    tag = new TagEntity { Name = tagName };
                    _dbContext.Tags.Add(tag);
                    await _dbContext.SaveChangesAsync();
                }

                postTags.Add(new PostTagEntity { PostId = postId, TagId = tag.Id });
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
    }
}