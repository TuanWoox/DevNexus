using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityQAPostReportService : BaseCommunityContentReportService<QAPost, CommunityQAPostReports>
    {
        public CommunityQAPostReportService(ApplicationDbContext context, IUserContext userContext) : base(context, userContext)
        {
        }

        protected override CommunityQAPostReports CreateReportContent(ReportContentDTO reportContentDTO, QAPost entity)
        {
            return new CommunityQAPostReports
            {
                CommunityId = reportContentDTO.CommunityId,
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
    }
}
