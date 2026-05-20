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
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityCommentReportService : BaseCommunityContentReportService<Comment, CommunityCommentsReport, SelectCommunityCommentsReportDTO>, ICommunityContentReportService
    {
        public CommunityCommentReportService(ApplicationDbContext context, IUserContext userContext, IRepository<CommunityCommentsReport, string> repository, ISocialGuardService socialGuardService) : base(context, userContext, repository, socialGuardService)
        {
        }

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
            var commentQuery = _context.Comments
                .Where(x => x.Id == contentId)
                .Where(x =>
                    (!string.IsNullOrEmpty(x.PostId)
                        && x.Post!.CommunityId == communityId
                        && _context.Posts
                            .Where(p => p.Id == x.PostId)
                            .ApplyPostVisibilityRules(_context, _userContext.ProfileId)
                            .Any())
                    || (!string.IsNullOrEmpty(x.AnswerId)
                        && x.Answer!.QAPost.CommunityId == communityId
                        && _context.Posts
                            .OfType<QAPost>()
                            .Where(q => q.Id == x.Answer.QAPostId)
                            .ApplyQAPostVisibilityRules(_context, _userContext.ProfileId)
                            .Any()));

            return await commentQuery.FirstOrDefaultAsync();
        }

        protected override DbSet<CommunityCommentsReport> GetReportDbSet()
        {
            return _context.CommunityCommentsReports;
        }

        protected override IQueryable<CommunityCommentsReport> BuildQueryForPaging(string communityId, string? userId)
        {
            var query = _context.CommunityCommentsReports
                .Include(r => r.Comment)
                    .ThenInclude(c => c.Post)
                .Include(r => r.Comment)
                    .ThenInclude(c => c.Answer)
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
