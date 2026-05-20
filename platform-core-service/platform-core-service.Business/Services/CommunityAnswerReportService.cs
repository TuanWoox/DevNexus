using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityAnswerReportService : BaseCommunityContentReportService<Answer, CommunityAnswersReport>, ICommunityContentReportService
    {
        public CommunityAnswerReportService(ApplicationDbContext context, IUserContext userContext) : base(context, userContext)
        {
        }

        protected override CommunityAnswersReport CreateReportContent(ReportContentDTO reportContentDTO, Answer entity)
        {
            return new CommunityAnswersReport
            {
                CommunityId = reportContentDTO.CommunityId,
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
    }
}
