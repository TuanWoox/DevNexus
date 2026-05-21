using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityAnswersReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityAnswerReportService : BaseCommunityContentReportService<Answer, CommunityAnswersReport, SelectCommunityAnswersReportDTO>, ICommunityContentReportService
    {
        public CommunityAnswerReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityAnswersReport, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService) : base(context, userContext, repository, socialGuardService, banService)
        {
        }

        protected override CommunityAnswersReport CreateReportContent(string communityId, ReportContentDTO reportContentDTO, Answer entity)
        {
            return new CommunityAnswersReport
            {
                CommunityId = communityId,
                AnswerId = reportContentDTO.ContentId,
                Reason = reportContentDTO.Reason,
                ReporterId = _userContext.ProfileId,
                ReportedProfileId = entity.AuthorId
            };
        }

        protected override async Task<Answer?> GetEntity(string contentId, string communityId)
        {
            var visibleQAPostIds = _context.Posts
                .OfType<QAPost>()
                .Where(q => q.CommunityId == communityId)
                .ApplyQAPostVisibilityRules(_context, _userContext.ProfileId)
                .Select(q => q.Id);

            var answerQuery = _context.Answers
                .Where(x => x.Id == contentId
                    && !x.Deleted
                    && visibleQAPostIds.Contains(x.QAPostId));

            return await answerQuery.FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityAnswersReport> GetReportDbSet()
        {
            return _context.CommunityAnswersReports;
        }

        protected override IQueryable<CommunityAnswersReport> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityAnswersReports
                .ApplyCommunityReportDashboardQuery(communityId, userId)
                .Include(r => r.Answer)
                    .ThenInclude(a => a.QAPost)
                .Include(r => r.Community)
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy);

            return query;
        }

        protected override string GetContentIdFromReport(CommunityAnswersReport report)
            => report.AnswerId;

        protected override async Task<List<CommunityAnswersReport>> GetAllPendingReportsForContent(string contentId, string communityId)
            => await _context.CommunityAnswersReports
                .Where(r => r.AnswerId == contentId
                    && r.CommunityId == communityId
                    && r.Status == Common.Utils.Enums.ReportStatus.Pending
                    && r.ResolutionAction == Common.Utils.Enums.ReportResolutionAction.None)
                .ToListAsync();

        protected override Task SoftDeleteContent(Answer content)
        {
            content.Deleted = true;
            content.DateDeleted = DateTimeOffset.UtcNow;
            _context.Answers.Update(content);
            return Task.CompletedTask;
        }
    }
}
