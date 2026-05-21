using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Helper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ReportTargetActionExecutor : IReportTargetActionExecutor
    {
        private readonly ApplicationDbContext _context;
        private readonly IAdminPostService _adminPostService;
        private readonly IAdminUserService _adminUserService;
        private readonly IAdminAuditLogService _adminAuditLogService;

        public ReportTargetActionExecutor(
            ApplicationDbContext context,
            IAdminPostService adminPostService,
            IAdminUserService adminUserService,
            IAdminAuditLogService adminAuditLogService)
        {
            _context = context;
            _adminPostService = adminPostService;
            _adminUserService = adminUserService;
            _adminAuditLogService = adminAuditLogService;
        }

        public async Task<ReturnResult<bool>> ExecuteAsync(
            ModerationReport report,
            ReportTargetAction action,
            ResolveReportDTO dto)
        {
            var result = new ReturnResult<bool>();

            var validationError = ValidateCompatibility(report.TargetType, action);
            if (validationError != null)
            {
                result.Message = validationError;
                return result;
            }

            try
            {
                switch (action)
                {
                    case ReportTargetAction.HideContent:
                        return await ExecuteHideContentAsync(report, dto);

                    case ReportTargetAction.DeleteComment:
                        return await ExecuteDeleteCommentAsync(report);

                    case ReportTargetAction.DeleteAnswer:
                        return await ExecuteDeleteAnswerAsync(report);

                    case ReportTargetAction.SuspendUser:
                        return await ExecuteSuspendUserAsync(report, dto);

                    default:
                        result.Message = $"Unknown target action: {action}";
                        return result;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[ReportTargetAction] Failed to execute {action} for report {report.Id}: {ex.Message}");
                result.Message = $"Target action execution failed: {ex.Message}";
                return result;
            }
        }

        private static string? ValidateCompatibility(ReportTargetType targetType, ReportTargetAction action)
        {
            var isValid = action switch
            {
                ReportTargetAction.HideContent =>
                    targetType == ReportTargetType.Post || targetType == ReportTargetType.Question,

                ReportTargetAction.DeleteComment =>
                    targetType == ReportTargetType.Comment,

                ReportTargetAction.DeleteAnswer =>
                    targetType == ReportTargetType.Answer,

                ReportTargetAction.SuspendUser =>
                    targetType == ReportTargetType.Profile,

                _ => false
            };

            return isValid
                ? null
                : $"Target action '{action}' is not compatible with target type '{targetType}'.";
        }

        /// <summary>
        /// Post/Question: delegates to ForceRejectAsync which sets ModerationStatus = Flagged,
        /// resolves open queue entries, and writes its own audit log.
        /// Note: ForceRejectAsync calls SaveChangesAsync internally.
        /// </summary>
        private async Task<ReturnResult<bool>> ExecuteHideContentAsync(ModerationReport report, ResolveReportDTO dto)
        {
            var reasonText = dto.TargetActionReason?.Trim();
            if (string.IsNullOrWhiteSpace(reasonText))
            {
                return new ReturnResult<bool> { Message = "TargetActionReason is required when hiding content." };
            }

            return await _adminPostService.ForceRejectAsync(report.TargetId, new AdminForceRejectPostDTO
            {
                ReasonText = reasonText,
                ModeratorNote = $"[Report #{report.Id}] {dto.ModeratorNote ?? "Enforcement via report resolve"}"
            });
        }

        /// <summary>
        /// Comment: admin-safe soft-delete. Bypasses ownership check, cascades to replies,
        /// and writes an audit log. Does NOT call SaveChangesAsync — relies on caller's SaveChanges.
        /// </summary>
        private async Task<ReturnResult<bool>> ExecuteDeleteCommentAsync(ModerationReport report)
        {
            var result = new ReturnResult<bool>();

            var comment = await _context.Comments
                .IgnoreQueryFilters()
                .Include(c => c.Replies)
                .FirstOrDefaultAsync(c => c.Id == report.TargetId);

            if (comment == null)
            {
                result.Message = $"Comment {report.TargetId} not found.";
                return result;
            }

            if (comment.Deleted)
            {
                result.Message = $"Comment {report.TargetId} is already deleted.";
                return result;
            }

            var oldState = new { deleted = false, replyCount = comment.Replies?.Count ?? 0 };

            comment.Deleted = true;
            comment.DateDeleted = DateTimeOffset.UtcNow;

            if (comment.Replies != null)
            {
                foreach (var reply in comment.Replies)
                {
                    reply.Deleted = true;
                    reply.DateDeleted = DateTimeOffset.UtcNow;
                }
            }

            var newState = new
            {
                deleted = true,
                replyCount = comment.Replies?.Count ?? 0,
                cascadeDeletedReplies = comment.Replies?.Count ?? 0
            };

            await _adminAuditLogService.AddAsync(AdminAuditLogFactory.ForReportAction(
                AuditActionType.ReportTargetActionExecuted,
                report.Id,
                $"Comment on {(string.IsNullOrEmpty(comment.PostId) ? "Answer" : "Post")}",
                oldState,
                newState,
                metadata: new
                {
                    reportId = report.Id,
                    commentId = comment.Id,
                    targetType = report.TargetType.ToString(),
                    action = ReportTargetAction.DeleteComment.ToString()
                }));

            result.Result = true;
            return result;
        }

        /// <summary>
        /// Answer: admin-safe soft-delete. Bypasses ownership check, unmarks accepted status,
        /// and writes an audit log. Does NOT call SaveChangesAsync — relies on caller's SaveChanges.
        /// </summary>
        private async Task<ReturnResult<bool>> ExecuteDeleteAnswerAsync(ModerationReport report)
        {
            var result = new ReturnResult<bool>();

            var answer = await _context.Answers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == report.TargetId);

            if (answer == null)
            {
                result.Message = $"Answer {report.TargetId} not found.";
                return result;
            }

            if (answer.Deleted)
            {
                result.Message = $"Answer {report.TargetId} is already deleted.";
                return result;
            }

            var oldState = new { deleted = false, isAccepted = answer.IsAccepted };

            if (answer.IsAccepted)
            {
                answer.IsAccepted = false;
            }

            answer.Deleted = true;
            answer.DateDeleted = DateTimeOffset.UtcNow;

            var newState = new
            {
                deleted = true,
                isAccepted = false,
                wasAccepted = oldState.isAccepted
            };

            await _adminAuditLogService.AddAsync(AdminAuditLogFactory.ForReportAction(
                AuditActionType.ReportTargetActionExecuted,
                report.Id,
                $"Answer on QAPost {answer.QAPostId}",
                oldState,
                newState,
                metadata: new
                {
                    reportId = report.Id,
                    answerId = answer.Id,
                    qaPostId = answer.QAPostId,
                    targetType = report.TargetType.ToString(),
                    action = ReportTargetAction.DeleteAnswer.ToString(),
                    wasAccepted = oldState.isAccepted
                }));

            result.Result = true;
            return result;
        }

        /// <summary>
        /// Profile: delegates to SuspendUserAsync which sets IsSuspended = true,
        /// calculates SuspendedUntil, and writes its own audit log.
        /// Note: SuspendUserAsync calls SaveChangesAsync internally.
        /// </summary>
        private async Task<ReturnResult<bool>> ExecuteSuspendUserAsync(ModerationReport report, ResolveReportDTO dto)
        {
            if (string.IsNullOrEmpty(report.TargetOwnerId))
            {
                return new ReturnResult<bool> { Message = "Target owner ID is missing from the report." };
            }

            return await _adminUserService.SuspendUserAsync(
                report.TargetOwnerId,
                new AdminSuspendUserDTO { DaySuspend = dto.SuspendDays });
        }
    }
}
