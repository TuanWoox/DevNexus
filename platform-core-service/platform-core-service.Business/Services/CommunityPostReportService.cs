using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Data;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Interfaces.Services;


namespace platform_core_service.Business.Services
{
    public class CommunityPostReportService : BaseCommunityContentReportService<Post, CommunityPostsReport>, ICommunityContentReportService
    {
        public CommunityPostReportService(ApplicationDbContext context, IUserContext userContext) : base(context, userContext)
        {
        }

        protected override CommunityPostsReport CreateReportContent(ReportContentDTO reportContentDTO, Post entity)
        {
            return new CommunityPostsReport
            {
                CommunityId = reportContentDTO.CommunityId,
                PostId = reportContentDTO.ContentId,
                Reason = reportContentDTO.Reason,
                ReporterId = _userContext.ProfileId,
                ReportedProfileId = entity.AuthorId
            };
        }

        protected override async Task<Post?> GetEntity(string contentId, string communityId)
        {
            var postQuery = _context.Posts
                .Where(x => x.Id == contentId && x.CommunityId == communityId);

            return await postQuery
                .ApplyPostVisibilityRules(_context, _userContext.ProfileId)
                .FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityPostsReport> GetReportDbSet()
        {
            return _context.CommunityPostsReports;
        }
    }
}
