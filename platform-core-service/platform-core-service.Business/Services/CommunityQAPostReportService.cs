using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityQAPostReports;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityQAPostReportService : BaseCommunityContentReportService<QAPost, CommunityQAPostReports, SelectCommunityQAPostReportsDTO>, ICommunityContentReportService
    {
        public CommunityQAPostReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityQAPostReports, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService) : base(context, userContext, repository, socialGuardService, banService)
        {
        }


        protected override CommunityQAPostReports CreateReportContent(string communityId, ReportContentDTO reportContentDTO, QAPost entity)
        {
            return new CommunityQAPostReports
            {
                CommunityId = communityId,
                QAPostId = reportContentDTO.ContentId,
                Reason = reportContentDTO.Reason,
                ReporterId = _userContext.ProfileId,
                ReportedProfileId = entity.AuthorId
            };
        }

        protected override async Task<QAPost?> GetEntity(string contentId, string communityId)
        {
            var qaPostQuery = _context.Posts
                .OfType<QAPost>()
                .Where(x => x.Id == contentId && x.CommunityId == communityId);

            return await qaPostQuery
                .ApplyQAPostVisibilityRules(_context, _userContext.ProfileId)
                .FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityQAPostReports> GetReportDbSet()
        {
            return _context.CommunityQAPostReports;
        }

        protected override IQueryable<CommunityQAPostReports> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityQAPostReports
                .ApplyCommunityReportDashboardQuery(communityId, userId)
                .Include(r => r.QAPost)
                .Include(r => r.Community)
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy);

            return query;
        }

        protected override string GetContentIdFromReport(CommunityQAPostReports report)
            => report.QAPostId;

        protected override async Task<List<CommunityQAPostReports>> GetAllPendingReportsForContent(string contentId, string communityId)
            => await _context.CommunityQAPostReports
                .Where(r => r.QAPostId == contentId
                    && r.CommunityId == communityId
                    && r.Status == Common.Utils.Enums.ReportStatus.Pending
                    && r.ResolutionAction == Common.Utils.Enums.ReportResolutionAction.None)
                .ToListAsync();

        protected override Task SoftDeleteContent(QAPost content)
        {
            content.Deleted = true;
            content.DateDeleted = DateTimeOffset.UtcNow;
            _context.Posts.Update(content);
            return Task.CompletedTask;
        }
    }
}
