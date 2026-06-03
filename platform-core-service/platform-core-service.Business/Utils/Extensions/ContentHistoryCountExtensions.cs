using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Data;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class ContentHistoryCountExtensions
    {
        public static async Task HydrateHistoryCountsAsync(
            this IEnumerable<SelectPostDTO> posts,
            ApplicationDbContext context)
        {
            var postList = posts.Where(p => p != null).ToList();
            if (postList.Count == 0) return;

            var contentIds = postList.Select(p => p.Id).Distinct().ToList();

            var postHistoryCounts = await context.PostHistories
                .AsNoTracking()
                .Where(h => contentIds.Contains(h.PostId))
                .GroupBy(h => h.PostId)
                .Select(g => new { ContentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ContentId, x => x.Count);

            var qaHistoryCounts = await context.QAPostHistories
                .AsNoTracking()
                .Where(h => contentIds.Contains(h.QAPostId))
                .GroupBy(h => h.QAPostId)
                .Select(g => new { ContentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ContentId, x => x.Count);

            foreach (var post in postList)
            {
                post.HistoryCount = qaHistoryCounts.TryGetValue(post.Id, out var qaCount)
                    ? qaCount
                    : postHistoryCounts.GetValueOrDefault(post.Id, 0);
            }
        }
    }
}
