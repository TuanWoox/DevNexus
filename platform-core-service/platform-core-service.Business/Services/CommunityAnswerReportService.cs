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
        public CommunityAnswerReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityAnswersReport, string> repository, ISocialGuardService socialGuardService) : base(context, userContext, repository, socialGuardService)
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
            var answerQuery = _context.Answers
                .Where(x => x.Id == contentId && x.QAPost.CommunityId == communityId)
                .Where(x => _context.Posts
                    .OfType<QAPost>()
                    .Where(q => q.Id == x.QAPostId)
                    .ApplyQAPostVisibilityRules(_context, _userContext.ProfileId)
                    .Any());

            return await answerQuery.FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityAnswersReport> GetReportDbSet()
        {
            return _context.CommunityAnswersReports;
        }

        protected override IQueryable<CommunityAnswersReport> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityAnswersReports
                .Include(r => r.Answer)
                    .ThenInclude(a => a.QAPost)
                .Include(r => r.Community)
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy)
                .Where(r => r.CommunityId == communityId);

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(r => r.ReporterId == userId);
            }

            return query;
        }
    }
}
