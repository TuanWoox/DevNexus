using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityPostsReport;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityPostReportService : BaseCommunityContentReportService<Post, CommunityPostsReport, SelectCommunityPostsReportDTO>, ICommunityContentReportService
    {
        public CommunityPostReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityPostsReport, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService, Hangfire.IBackgroundJobClient backgroundJobClient, IMapper mapper) : base(context, userContext, repository, socialGuardService, banService, backgroundJobClient, mapper)
        {
        }

        protected override ContentType ContentType => ContentType.Post;

        protected override IQueryable<CommunityPostsReport> BuildQueryForDetail(string communityId, string reportId)
            => base.BuildQueryForDetail(communityId, reportId).Include(r => r.Post);

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
                .ApplyCommunityReportDashboardQuery(communityId, userId)
                .Include(r => r.Post)
                .Include(r => r.Community)
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy);

            return query;
        }

        protected override string GetContentIdFromReport(CommunityPostsReport report)
            => report.PostId;

        protected override async Task<List<CommunityPostsReport>> GetAllPendingReportsForContent(string contentId, string communityId)
            => await _context.CommunityPostsReports
                .Where(r => r.PostId == contentId
                    && r.CommunityId == communityId
                    && r.Status == ReportStatus.Pending
                    && r.ResolutionAction == ReportResolutionAction.None)
                .ToListAsync();

        protected override Task SoftDeleteContent(Post content)
        {
            content.Deleted = true;
            content.DateDeleted = DateTimeOffset.UtcNow;
            _context.Posts.Update(content);
            return Task.CompletedTask;
        }
    }
}
