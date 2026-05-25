using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Text.Json;

namespace platform_core_service.Business.Services
{
    public class ReportService : IReportService
    {
        private static readonly ReportStatus[] OpenStatuses =
        [
            ReportStatus.Pending,
            ReportStatus.InReview,
            ReportStatus.Escalated
        ];

        private static readonly JsonSerializerOptions SnapshotJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IPostHistoryService _postHistoryService;
        private readonly IQAPostHistoryService _qaPostHistoryService;
        private readonly ICommentHistoryService _commentHistoryService;
        private readonly IAnswerHistoryService _answerHistoryService;

        public ReportService(
            ApplicationDbContext context,
            IUserContext userContext,
            IMapper mapper,
            IPostHistoryService postHistoryService,
            IQAPostHistoryService qaPostHistoryService,
            ICommentHistoryService commentHistoryService,
            IAnswerHistoryService answerHistoryService)
        {
            _context = context;
            _userContext = userContext;
            _mapper = mapper;
            _postHistoryService = postHistoryService;
            _qaPostHistoryService = qaPostHistoryService;
            _commentHistoryService = commentHistoryService;
            _answerHistoryService = answerHistoryService;
        }

        public async Task<ReturnResult<SelectReportDTO>> CreateAsync(CreateReportDTO dto)
        {
            var result = new ReturnResult<SelectReportDTO>();
            var reporterId = _userContext.ProfileId;
            if (string.IsNullOrWhiteSpace(reporterId))
            {
                result.Message = "A profile is required to submit a report.";
                return result;
            }

            var reporterExists = await _context.Profiles
                .AsNoTracking()
                .AnyAsync(p => p.Id == reporterId);

            if (!reporterExists)
            {
                result.Message = "Reporter profile was not found.";
                return result;
            }

            var target = await ResolveTargetAsync(dto.TargetType, dto.TargetId);
            if (target == null)
            {
                result.Message = "Report target was not found.";
                return result;
            }

            if (target.OwnerId == reporterId)
            {
                result.Message = "You cannot report your own content.";
                return result;
            }

            var existingOpenReport = await _context.ModerationReports
                .AsNoTracking()
                .FirstOrDefaultAsync(r =>
                    r.ReporterId == reporterId &&
                    r.TargetType == dto.TargetType &&
                    r.TargetId == dto.TargetId &&
                    OpenStatuses.Contains(r.Status));

            if (existingOpenReport != null)
            {
                result.Result = _mapper.Map<SelectReportDTO>(existingOpenReport);
                result.Message = "You already have an open report for this target.";
                return result;
            }

            ModerationReport report;
            var targetHistoryId = await EnsureCurrentTargetHistoryAsync(dto.TargetType, dto.TargetId);

            report = new ModerationReport
            {
                Id = Guid.NewGuid().ToString(),
                ReporterId = reporterId,
                TargetType = dto.TargetType,
                TargetId = dto.TargetId,
                TargetOwnerId = target.OwnerId,
                TargetHistoryId = targetHistoryId,
                TargetSnapshotJson = target.SnapshotJson,
                Reason = dto.Reason,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Status = ReportStatus.Pending
            };

            try
            {
                _context.ModerationReports.Add(report);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (IsOpenReportDuplicateViolation(ex))
            {
                result.Message = "You already have an open report for this target.";
                return result;
            }

            result.Result = _mapper.Map<SelectReportDTO>(report);
            result.Message = "Report submitted successfully.";
            return result;
        }

        private static bool IsOpenReportDuplicateViolation(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;
            return message.Contains("IX_ModerationReports_OpenDuplicateGuard", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<string?> EnsureCurrentTargetHistoryAsync(ReportTargetType targetType, string targetId)
        {
            return targetType switch
            {
                ReportTargetType.Post => (await _postHistoryService.RecordHistoryAsync(targetId)).Id,
                ReportTargetType.Question => (await _qaPostHistoryService.RecordHistoryAsync(targetId)).Id,
                ReportTargetType.Comment => (await _commentHistoryService.RecordHistoryAsync(targetId)).Id,
                ReportTargetType.Answer => (await _answerHistoryService.RecordHistoryAsync(targetId)).Id,
                ReportTargetType.Profile => null,
                _ => throw new ArgumentOutOfRangeException(nameof(targetType), targetType, "Unsupported report target type")
            };
        }

        private async Task<ResolvedReportTarget?> ResolveTargetAsync(ReportTargetType targetType, string targetId)
        {
            return targetType switch
            {
                ReportTargetType.Profile => await ResolveProfileTargetAsync(targetId),
                ReportTargetType.Post => await ResolvePostTargetAsync(targetId),
                ReportTargetType.Question => await ResolveQuestionTargetAsync(targetId),
                ReportTargetType.Comment => await ResolveCommentTargetAsync(targetId),
                ReportTargetType.Answer => await ResolveAnswerTargetAsync(targetId),
                _ => null
            };
        }

        private async Task<ResolvedReportTarget?> ResolveProfileTargetAsync(string targetId)
        {
            var profile = await _context.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == targetId && !p.IsSuspended);

            if (profile == null)
            {
                return null;
            }

            return new ResolvedReportTarget(
                profile.Id,
                BuildSnapshotJson("Profile", BuildPreview(profile.Bio, profile.FullName), profile.FullName, profile.AvatarUrl, $"/profile/{profile.Id}", profile.DateCreated, profile.DateModified, profile.Deleted));
        }

        private async Task<ResolvedReportTarget?> ResolvePostTargetAsync(string targetId)
        {
            var post = await _context.Posts
                .Where(p => p.GetType() == typeof(Post))
                .Include(p => p.Author)
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.Id == targetId &&
                    !p.Deleted &&
                    (p.ModerationStatus == ModerationStatus.Pending ||
                     p.ModerationStatus == ModerationStatus.Approved));

            if (post == null)
            {
                return null;
            }

            return new ResolvedReportTarget(
                post.AuthorId,
                BuildSnapshotJson(post.Title, BuildPreview(post.Content, post.Title), post.Author?.FullName, post.Author?.AvatarUrl, $"/post/{post.Id}", post.DateCreated, post.DateModified, post.Deleted));
        }

        private async Task<ResolvedReportTarget?> ResolveQuestionTargetAsync(string targetId)
        {
            var question = await _context.Posts
                .OfType<QAPost>()
                .Include(p => p.Author)
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.Id == targetId &&
                    !p.Deleted &&
                    (p.ModerationStatus == ModerationStatus.Pending ||
                     p.ModerationStatus == ModerationStatus.Approved));

            if (question == null)
            {
                return null;
            }

            return new ResolvedReportTarget(
                question.AuthorId,
                BuildSnapshotJson(question.Title, BuildPreview(question.Content, question.Title), question.Author?.FullName, question.Author?.AvatarUrl, $"/questions/{question.Id}", question.DateCreated, question.DateModified, question.Deleted));
        }

        private async Task<ResolvedReportTarget?> ResolveCommentTargetAsync(string targetId)
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .Include(c => c.Post)
                .Include(c => c.Answer)
                    .ThenInclude(a => a!.QAPost)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == targetId);

            if (comment == null || comment.Deleted || !IsCommentReportable(comment))
            {
                return null;
            }

            var route = comment.PostId != null
                ? $"/post/{comment.PostId}"
                : comment.Answer?.QAPostId != null
                    ? $"/questions/{comment.Answer.QAPostId}"
                    : null;
            return new ResolvedReportTarget(
                comment.AuthorId,
                BuildSnapshotJson("Comment", BuildPreview(comment.Content), comment.Author?.FullName, comment.Author?.AvatarUrl, route, comment.DateCreated, comment.DateModified, comment.Deleted));
        }

        private async Task<ResolvedReportTarget?> ResolveAnswerTargetAsync(string targetId)
        {
            var answer = await _context.Answers
                .Include(a => a.Author)
                .Include(a => a.QAPost)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == targetId);

            if (answer == null || answer.Deleted || !IsPostReportable(answer.QAPost))
            {
                return null;
            }

            return new ResolvedReportTarget(
                answer.AuthorId,
                BuildSnapshotJson("Answer", BuildPreview(answer.Content), answer.Author?.FullName, answer.Author?.AvatarUrl, $"/questions/{answer.QAPostId}", answer.DateCreated, answer.DateModified, answer.Deleted));
        }

        private static bool IsCommentReportable(Comment comment)
        {
            if (comment.PostId != null)
            {
                return IsPostReportable(comment.Post);
            }

            if (comment.AnswerId != null)
            {
                return comment.Answer != null && IsPostReportable(comment.Answer.QAPost);
            }

            return false;
        }

        private static bool IsPostReportable(Post? post)
        {
            return post != null && !post.Deleted && post.ModerationStatus.IsPubliclyVisible();
        }

        private static string BuildSnapshotJson(
            string? targetTitle,
            string? targetPreview,
            string? targetOwnerDisplayName,
            string? targetOwnerAvatarUrl,
            string? route,
            DateTimeOffset? createdAt,
            DateTimeOffset? updatedAt,
            bool isDeletedAtReportTime)
        {
            var snapshot = new
            {
                TargetTitle = targetTitle,
                TargetPreview = targetPreview,
                TargetOwnerDisplayName = targetOwnerDisplayName,
                TargetOwnerAvatarUrl = targetOwnerAvatarUrl,
                Route = route,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                IsDeletedAtReportTime = isDeletedAtReportTime
            };

            return JsonSerializer.Serialize(snapshot, SnapshotJsonOptions);
        }

        private static string? BuildPreview(string? content, string? fallback = null)
        {
            var value = string.IsNullOrWhiteSpace(content) ? fallback : content;
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            value = value.Trim();
            return value.Length <= 240 ? value : $"{value[..240]}...";
        }

        private sealed record ResolvedReportTarget(string OwnerId, string SnapshotJson);
    }
}
