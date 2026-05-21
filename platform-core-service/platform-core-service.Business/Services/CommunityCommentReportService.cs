using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Abstracts;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityCommentsReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityCommentReportService : BaseCommunityContentReportService<Comment, CommunityCommentsReport, SelectCommunityCommentsReportDTO>, ICommunityContentReportService
    {
        public CommunityCommentReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityCommentsReport, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService, Hangfire.IBackgroundJobClient backgroundJobClient, IMapper mapper) : base(context, userContext, repository, socialGuardService, banService, backgroundJobClient, mapper)
        {
        }

        protected override ContentType ContentType => ContentType.Comment;

        protected override IQueryable<CommunityCommentsReport> BuildQueryForDetail(string communityId, string reportId)
            => base.BuildQueryForDetail(communityId, reportId)
                .Include(r => r.Comment).ThenInclude(c => c.Post)
                .Include(r => r.Comment).ThenInclude(c => c.Answer).ThenInclude(a => a.QAPost);

        protected override CommunityCommentsReport CreateReportContent(string communityId, ReportContentDTO reportContentDTO, Comment entity)
        {
            return new CommunityCommentsReport
            {
                CommunityId = communityId,
                CommentId = reportContentDTO.ContentId,
                Reason = reportContentDTO.Reason,
                ReporterId = _userContext.ProfileId,
                ReportedProfileId = entity.AuthorId
            };
        }

        protected override async Task<Comment?> GetEntity(string contentId, string communityId)
        {
            var visiblePostIds = _context.Posts
                .Where(p => p.CommunityId == communityId)
                .ApplyPostVisibilityRules(_context, _userContext.ProfileId)
                .Select(p => p.Id);

            var visibleQAPostIds = _context.Posts
                .OfType<QAPost>()
                .Where(q => q.CommunityId == communityId)
                .ApplyQAPostVisibilityRules(_context, _userContext.ProfileId)
                .Select(q => q.Id);

            var commentQuery = _context.Comments
                .Where(x => x.Id == contentId && !x.Deleted)
                .Where(x =>
                    (!string.IsNullOrEmpty(x.PostId)
                        && visiblePostIds.Contains(x.PostId))
                    || (!string.IsNullOrEmpty(x.AnswerId)
                        && _context.Answers.Any(a =>
                            a.Id == x.AnswerId
                            && !a.Deleted
                            && visibleQAPostIds.Contains(a.QAPostId))));

            return await commentQuery.FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityCommentsReport> GetReportDbSet()
        {
            return _context.CommunityCommentsReports;
        }

        protected override IQueryable<CommunityCommentsReport> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityCommentsReports
                .ApplyCommunityReportDashboardQuery(communityId, userId)
                .Include(r => r.Comment)
                    .ThenInclude(c => c.Post)
                .Include(r => r.Comment)
                    .ThenInclude(c => c.Answer)
                        .ThenInclude(a => a.QAPost)
                .Include(r => r.Community)
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy);

            return query;
        }

        protected override string GetContentIdFromReport(CommunityCommentsReport report)
            => report.CommentId;

        protected override async Task<List<CommunityCommentsReport>> GetAllPendingReportsForContent(string contentId, string communityId)
            => await _context.CommunityCommentsReports
                .Where(r => r.CommentId == contentId
                    && r.CommunityId == communityId
                    && r.Status == Common.Utils.Enums.ReportStatus.Pending
                    && r.ResolutionAction == Common.Utils.Enums.ReportResolutionAction.None)
                .ToListAsync();

        protected override Task SoftDeleteContent(Comment content)
        {
            content.Deleted = true;
            content.DateDeleted = DateTimeOffset.UtcNow;
            _context.Comments.Update(content);
            return Task.CompletedTask;
        }
    }
}
