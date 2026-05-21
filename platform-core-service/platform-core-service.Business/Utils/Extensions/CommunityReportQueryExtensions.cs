using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class CommunityReportQueryExtensions
    {
        public static IQueryable<TReport> ApplyCommunityReportDashboardQuery<TReport>(
            this DbSet<TReport> reports,
            string communityId,
            string? userId)
            where TReport : BaseCommunityReport
        {
            var query = reports
                .IgnoreQueryFilters()
                .Where(r => !r.Deleted && r.CommunityId == communityId);

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(r => r.ReporterId == userId);
            }

            return query;
        }
    }
}
