using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;
using TagEntity = platform_core_service.Common.Entities.DbEntities.Tag;
using PostTagEntity = platform_core_service.Common.Entities.DbEntities.PostTag;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class PostService : IPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IRepository<PostEntity, string> _postRepository;

        public PostService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserContext userContext,
            IRepository<PostEntity, string> postRepository)
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _postRepository = postRepository;
        }

        public async Task<ReturnResult<SelectPostDTO>> CreateAsync(CreatePostDTO createDTO)
        {
            var result = new ReturnResult<SelectPostDTO>();
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

                // Step 3: Map DTO to entity
                var post = _mapper.Map<PostEntity>(createDTO);
                post.AuthorId = profileId;
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

                // Step 6: Save post
                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                // Step 7: Return mapped DTO
                var savedPost = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(p => p.Id == post.Id);

                result.Result = _mapper.Map<SelectPostDTO>(savedPost);
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
            var result = new ReturnResult<SelectPostDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(postId))
                {
                    result.Message = "Post ID is required";
                    return result;
                }

                // Step 2: Load post with tags (public read - no ownership check)
                var post = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);

                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectPostDTO>(post);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving post: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                // Step 1: Get current user profile
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 2: Build query for current user's posts
                var query = _context.Posts
                    .Where(p => p.AuthorId == profileId && !p.Deleted)
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _postRepository.GetPagingAsync<Page<string>, SelectPostDTO>(query, page);
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
                    .FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);

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

                // Step 8: Reload and return
                var updatedPost = await _context.Posts
                    .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                result.Result = _mapper.Map<SelectPostDTO>(updatedPost);
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
                var post = await _context.Posts.Include(p => p.PostTags).FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);
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
                _context.Remove(post);
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
                var ownedCount = await _context.Posts
                    .Where(p => postIds.Contains(p.Id) && p.AuthorId == profileId && !p.Deleted)
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

        // Helper method to generate slug from title
        private string GenerateSlug(string title)
        {
            if (string.IsNullOrEmpty(title)) return Guid.NewGuid().ToString().Substring(0, 8);

            var slug = title
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("--", "-");

            return slug;
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
                        Id = Guid.NewGuid().ToString(),
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
    }
}
