using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly ApplicationDbContext _context;

        public AdminDashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnResult<AdminDashboardDTO>> GetDashboardAsync()
        {
            var result = new ReturnResult<AdminDashboardDTO>();
            try
            {
                // PostgreSQL timestamp with time zone only accepts UTC (offset = 0).
                // new DateTimeOffset(date, TimeSpan.Zero) guarantees UTC — avoids the
                // "+07:00 not supported" Npgsql exception from DateTimeOffset.UtcNow.Date.
                var todayUtc    = new DateTimeOffset(DateTime.UtcNow.Date,            TimeSpan.Zero);
                var weekAgoUtc  = new DateTimeOffset(DateTime.UtcNow.Date.AddDays(-7),  TimeSpan.Zero);
                var monthAgoUtc = new DateTimeOffset(DateTime.UtcNow.Date.AddDays(-30), TimeSpan.Zero);

                // EF Core DbContext is NOT thread-safe — concurrent async operations on the
                // same scoped instance throw "A second operation was started on this context".
                // Queries must run sequentially, not via Task.WhenAll.
                var postStats = await _context.Posts
                    .GroupBy(p => p.ModerationStatus)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var totalPosts   = postStats.Sum(s => s.Count);
                var pending      = postStats.FirstOrDefault(s => s.Status == ModerationStatus.Pending)?.Count ?? 0;
                var approved     = postStats.FirstOrDefault(s => s.Status == ModerationStatus.Approved)?.Count ?? 0;
                var rejected     = postStats.FirstOrDefault(s => s.Status == ModerationStatus.Flagged)?.Count ?? 0;
                var postsToday   = await _context.Posts.CountAsync(p => p.DateCreated >= todayUtc);
                var queueEntries = await _context.ModerationQueueEntries.CountAsync(e => e.ResolvedAt == null);
                var totalUsers   = await _context.Profiles.CountAsync();

                var topTags = await _context.PostTags
                    .GroupBy(pt => pt.Tag.Name)
                    .Select(g => new TagStatDTO
                    {
                        TagName   = g.Key,
                        PostCount = g.Count()
                    })
                    .OrderByDescending(t => t.PostCount)
                    .Take(5)
                    .ToListAsync();

                // User growth metrics (Profile.DateCreated from BaseEntity<string>)
                var newUsersToday     = await _context.Profiles.CountAsync(p => p.DateCreated >= todayUtc);
                var newUsersThisWeek  = await _context.Profiles.CountAsync(p => p.DateCreated >= weekAgoUtc);
                var newUsersThisMonth = await _context.Profiles.CountAsync(p => p.DateCreated >= monthAgoUtc);

                // Post type breakdown (QAPost is TPH subtype of Post)
                var totalQuestionPosts = await _context.Posts.OfType<QAPost>().CountAsync();
                var totalNormalPosts   = await _context.Posts.CountAsync(p => !(p is QAPost));

                // Post volume by time window (all post types)
                var postsThisWeek  = await _context.Posts.CountAsync(p => p.DateCreated >= weekAgoUtc);
                var postsThisMonth = await _context.Posts.CountAsync(p => p.DateCreated >= monthAgoUtc);

                // Moderation status breakdown
                var inReviewPosts = await _context.Posts.CountAsync(p => p.ModerationStatus == ModerationStatus.InReview);
                var flaggedPosts  = await _context.Posts.CountAsync(p => p.ModerationStatus == ModerationStatus.Flagged);

                result.Result = new AdminDashboardDTO
                {
                    // --- Existing Phase 4 fields (unchanged) ---
                    TotalPosts    = totalPosts,
                    PendingPosts  = pending,
                    ApprovedPosts = approved,
                    RejectedPosts = rejected,
                    PostsToday    = postsToday,
                    QueueEntries  = queueEntries,
                    TotalUsers    = totalUsers,
                    TopTags       = topTags,
                    // --- Phase 6: New fields ---
                    NewUsersToday      = newUsersToday,
                    NewUsersThisWeek   = newUsersThisWeek,
                    NewUsersThisMonth  = newUsersThisMonth,
                    TotalQuestionPosts = totalQuestionPosts,
                    TotalNormalPosts   = totalNormalPosts,
                    PostsThisWeek      = postsThisWeek,
                    PostsThisMonth     = postsThisMonth,
                    InReviewPosts      = inReviewPosts,
                    FlaggedPosts       = flaggedPosts,
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while building dashboard: {ex.Message}";
            }
            return result;
        }
    }
}
