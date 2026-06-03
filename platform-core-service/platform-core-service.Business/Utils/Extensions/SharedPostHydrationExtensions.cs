using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class SharedPostHydrationExtensions
    {
        public static async Task HydrateSharedPostsAsync(
            this IEnumerable<SelectPostDTO> posts,
            ApplicationDbContext context,
            string currentProfileId)
        {
            var postList = posts.Where(p => p != null).ToList();
            if (!postList.Any()) return;

            var sharedPostIds = postList
                .Select(p => p.SharedPostId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            if (!sharedPostIds.Any()) return;

            var sharedPosts = await context.Posts
                .AsNoTracking()
                .ApplyPostVisibilityRules(context, currentProfileId)
                .Where(p => sharedPostIds.Contains(p.Id))
                .Include(p => p.Author)
                .Include(p => p.Community)
                .ToListAsync();

            var sharedPostMap = sharedPosts.ToDictionary(p => p.Id, ToSharedPostDto);

            foreach (var post in postList)
            {
                post.SharedPost = post.SharedPostId != null &&
                                  sharedPostMap.TryGetValue(post.SharedPostId, out var sharedPost)
                    ? sharedPost
                    : null;
            }
        }

        private static SelectSharedPostDTO ToSharedPostDto(Post post)
        {
            return new SelectSharedPostDTO
            {
                Id = post.Id,
                Title = post.Title,
                ContentPreview = post.Content ?? string.Empty,
                CommunityId = post.CommunityId,
                Community = post.Community == null
                    ? null
                    : new SelectPostCommunityDTO
                    {
                        Id = post.Community.Id,
                        Name = post.Community.Name,
                        Slug = post.Community.Slug,
                        CommunityCoverPhotoUrl = post.Community.CommunityCoverPhotoUrl
                    },
                Author = post.Author == null
                    ? null
                    : new SelectPostAuthorDTO
                    {
                        Id = post.Author.Id,
                        FullName = post.Author.FullName,
                        AvatarUrl = post.Author.AvatarUrl,
                        BackgroundUrl = post.Author.BackgroundUrl,
                        Bio = post.Author.Bio,
                        ReputationPoints = post.Author.ReputationPoints,
                        TechStacks = post.Author.TechStacks ?? new List<string>(),
                        IsPrivate = post.Author.IsPrivate
                    },
                ContentType = post is QAPost ? SharedContentType.QAPost : SharedContentType.Post,
                DateCreated = post.DateCreated ?? DateTimeOffset.UtcNow
            };
        }

        private static string BuildPreview(string? content)
        {
            if (string.IsNullOrWhiteSpace(content)) return string.Empty;

            var normalized = content.Trim();
            return normalized.Length <= 240 ? normalized : $"{normalized[..240]}...";
        }
    }
}
