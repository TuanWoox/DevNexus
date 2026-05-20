using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Data;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityPostsReport;


namespace platform_core_service.Business.Services
{
    public class CommunityPostReportService : BaseCommunityContentReportService<Post, CommunityPostsReport, SelectCommunityPostsReportDTO>, ICommunityContentReportService
    {
        public CommunityPostReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityPostsReport, string> repository, ISocialGuardService socialGuardService) : base(context, userContext, repository, socialGuardService)
        {
        }

        protected override CommunityPostsReport CreateReportContent(string communityId, ReportContentDTO reportContentDTO, Post entity)
        {
            return new CommunityPostsReport
            {
                CommunityId = communityId,
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

        protected override IQueryable<CommunityPostsReport> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityPostsReports
                .Include(r => r.Post)
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
