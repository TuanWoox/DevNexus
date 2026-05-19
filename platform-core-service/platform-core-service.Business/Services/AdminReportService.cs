using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.EntityDTO.Report;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Text.Json;

namespace platform_core_service.Business.Services
{
    public class AdminReportService : IAdminReportService
    {
        private static readonly JsonSerializerOptions SnapshotJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IPostHistoryService _postHistoryService;
        private readonly IQAPostHistoryService _qaPostHistoryService;
        private readonly ICommentHistoryService _commentHistoryService;
        private readonly IAnswerHistoryService _answerHistoryService;

        public AdminReportService(
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

        public async Task<ReturnResult<PagedData<AdminReportDTO, string>>> GetPagingAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminReportDTO, string>>();
            try
            {
                var query = _context.ModerationReports
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .AsQueryable();

                page.FormatFilter(ref query);

                if (page.Orders == null || page.Orders.Count == 0)
                {
                    query = query.OrderByDescending(r => r.DateCreated);
                }
                else
                {
                    page.FormatOrder(ref query);
                }

                var total = await query.CountAsync();
                var pagedQuery = query;
                if (page.Size != -1)
                {
                    pagedQuery = pagedQuery
                        .Skip(page.PageNumber * page.Size)
                        .Take(page.Size);
                }

                var reports = await pagedQuery.ToListAsync();
                var data = await BuildAdminReportDTOsAsync(reports);
                page.TotalElements = total;

                result.Result = new PagedData<AdminReportDTO, string>(page)
                {
                    Data = data
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                result.Message = $"An error occurred while retrieving reports: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<AdminReportDetailDTO>> GetByIdAsync(string id)
        {
            var result = new ReturnResult<AdminReportDetailDTO>();
            try
            {
                var report = await _context.ModerationReports
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (report == null)
                {
                    result.Message = $"Report {id} not found";
                    return result;
                }

                var isStaffSensitive = await IsStaffProfileAsync(report.TargetOwnerId);
                if (isStaffSensitive && !_userContext.IsAdmin)
                {
                    result.Message = "Only admins can view staff-sensitive reports.";
                    return result;
                }

                var reportDto = (await BuildAdminReportDTOsAsync([report])).First();
                var reportedVersion = await GetReportedVersionAsync(report);
                var currentTarget = await GetCurrentTargetAsync(report.TargetType, report.TargetId);
                var summaries = await GetProfileSummariesAsync(
                    [report.ReporterId, report.TargetOwnerId, report.ResolvedById, report.AssignedModeratorId]);

                result.Result = new AdminReportDetailDTO
                {
                    Report = reportDto,
                    ReportedVersion = reportedVersion,
                    CurrentTarget = currentTarget,
                    Reporter = summaries.GetValueOrDefault(report.ReporterId),
                    TargetOwner = summaries.GetValueOrDefault(report.TargetOwnerId),
                    TargetSnapshotJson = report.TargetSnapshotJson,
                    TargetSnapshot = DeserializeSnapshot(report.TargetSnapshotJson),
                    ModeratorNote = report.ModeratorNote,
                    Resolution = report.Resolution,
                    ResolutionNote = report.ResolutionNote,
                    ResolvedById = report.ResolvedById,
                    ResolvedBy = report.ResolvedById == null ? null : summaries.GetValueOrDefault(report.ResolvedById),
                    ResolvedAt = report.ResolvedAt
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                result.Message = $"An error occurred while retrieving report detail: {ex.Message}";
            }

            return result;
        }

        private async Task<List<AdminReportDTO>> BuildAdminReportDTOsAsync(List<ModerationReport> reports)
        {
            var profileIds = reports
                .SelectMany(r => new[] { r.ReporterId, r.TargetOwnerId, r.AssignedModeratorId })
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();
            var summaries = await GetProfileSummariesAsync(profileIds);
            var staffIds = await GetStaffProfileIdsAsync(reports.Select(r => r.TargetOwnerId).Distinct().ToList());

            return reports.Select(report =>
            {
                var snapshot = DeserializeSnapshot(report.TargetSnapshotJson);
                return new AdminReportDTO
                {
                    Id = report.Id,
                    TargetType = report.TargetType,
                    TargetId = report.TargetId,
                    TargetHistoryId = report.TargetHistoryId,
                    Reason = report.Reason,
                    DescriptionPreview = BuildPreview(report.Description),
                    Status = report.Status,
                    Reporter = summaries.GetValueOrDefault(report.ReporterId),
                    TargetOwner = summaries.GetValueOrDefault(report.TargetOwnerId),
                    TargetTitle = snapshot?.TargetTitle,
                    TargetPreview = snapshot?.TargetPreview,
                    TargetRoute = snapshot?.Route,
                    AssignedModeratorId = report.AssignedModeratorId,
                    AssignedModerator = report.AssignedModeratorId == null ? null : summaries.GetValueOrDefault(report.AssignedModeratorId),
                    Resolution = report.Resolution,
                    ResolvedAt = report.ResolvedAt,
                    DateCreated = report.DateCreated,
                    IsStaffSensitive = staffIds.Contains(report.TargetOwnerId)
                };
            }).ToList();
        }

        private async Task<Dictionary<string, ProfileSummaryDTO>> GetProfileSummariesAsync(IEnumerable<string?> profileIds)
        {
            var ids = profileIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .Distinct()
                .ToList();

            if (ids.Count == 0)
            {
                return new Dictionary<string, ProfileSummaryDTO>();
            }

            var profiles = await _context.Profiles
                .IgnoreQueryFilters()
                .Include(p => p.ApplicationUser)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .Where(p => ids.Contains(p.Id))
                .ToListAsync();

            return profiles.ToDictionary(
                p => p.Id,
                p => new ProfileSummaryDTO
                {
                    Id = p.Id,
                    ApplicationUserId = p.ApplicationUserId,
                    DisplayName = p.FullName,
                    AvatarUrl = p.AvatarUrl,
                    Role = p.ApplicationUser?.UserRoles?.FirstOrDefault()?.Role?.Name,
                    IsSuspended = p.IsSuspended,
                    Deleted = p.Deleted
                });
        }

        private async Task<HashSet<string>> GetStaffProfileIdsAsync(List<string> profileIds)
        {
            if (profileIds.Count == 0)
            {
                return [];
            }

            var staffIds = await _context.Profiles
                .IgnoreQueryFilters()
                .Include(p => p.ApplicationUser)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .Where(p => profileIds.Contains(p.Id) &&
                    p.ApplicationUser.UserRoles.Any(ur => ur.Role.Name == "Admin" || ur.Role.Name == "Moderator"))
                .Select(p => p.Id)
                .ToListAsync();

            return staffIds.ToHashSet();
        }

        private async Task<bool> IsStaffProfileAsync(string profileId)
        {
            return await _context.Profiles
                .IgnoreQueryFilters()
                .Include(p => p.ApplicationUser)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .AnyAsync(p => p.Id == profileId &&
                    p.ApplicationUser.UserRoles.Any(ur => ur.Role.Name == "Admin" || ur.Role.Name == "Moderator"));
        }

        private async Task<object?> GetReportedVersionAsync(ModerationReport report)
        {
            if (report.TargetType == ReportTargetType.Profile)
            {
                return DeserializeSnapshot(report.TargetSnapshotJson);
            }

            if (string.IsNullOrWhiteSpace(report.TargetHistoryId))
            {
                return null;
            }

            return report.TargetType switch
            {
                ReportTargetType.Post => await _postHistoryService.GetVersionAsync(report.TargetHistoryId),
                ReportTargetType.Question => await _qaPostHistoryService.GetVersionAsync(report.TargetHistoryId),
                ReportTargetType.Comment => await _commentHistoryService.GetVersionAsync(report.TargetHistoryId),
                ReportTargetType.Answer => await _answerHistoryService.GetVersionAsync(report.TargetHistoryId),
                _ => null
            };
        }

        private async Task<object?> GetCurrentTargetAsync(ReportTargetType targetType, string targetId)
        {
            return targetType switch
            {
                ReportTargetType.Profile => await GetCurrentProfileTargetAsync(targetId),
                ReportTargetType.Post => await GetCurrentPostTargetAsync(targetId),
                ReportTargetType.Question => await GetCurrentQuestionTargetAsync(targetId),
                ReportTargetType.Comment => await GetCurrentCommentTargetAsync(targetId),
                ReportTargetType.Answer => await GetCurrentAnswerTargetAsync(targetId),
                _ => null
            };
        }

        private async Task<SelectProfileDTO?> GetCurrentProfileTargetAsync(string targetId)
        {
            var profile = await _context.Profiles
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == targetId);

            return profile == null ? null : _mapper.Map<SelectProfileDTO>(profile);
        }

        private async Task<SelectPostDTO?> GetCurrentPostTargetAsync(string targetId)
        {
            var post = await _context.Posts
                .IgnoreQueryFilters()
                .Where(p => p.GetType() == typeof(Post))
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Include(p => p.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == targetId);

            return post == null ? null : _mapper.Map<SelectPostDTO>(post);
        }

        private async Task<SelectQAPostDTO?> GetCurrentQuestionTargetAsync(string targetId)
        {
            var question = await _context.Posts
                .IgnoreQueryFilters()
                .OfType<QAPost>()
                .Include(q => q.Answers)
                .Include(q => q.Author)
                .Include(q => q.Community)
                .Include(q => q.PostTags)
                    .ThenInclude(pt => pt.Tag)
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.Id == targetId);

            return question == null ? null : _mapper.Map<SelectQAPostDTO>(question);
        }

        private async Task<SelectCommentDTO?> GetCurrentCommentTargetAsync(string targetId)
        {
            var comment = await _context.Comments
                .IgnoreQueryFilters()
                .Include(c => c.Author)
                .Include(c => c.Replies)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == targetId);

            return comment == null ? null : _mapper.Map<SelectCommentDTO>(comment);
        }

        private async Task<SelectAnswerDTO?> GetCurrentAnswerTargetAsync(string targetId)
        {
            var answer = await _context.Answers
                .IgnoreQueryFilters()
                .Include(a => a.Author)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == targetId);

            return answer == null ? null : _mapper.Map<SelectAnswerDTO>(answer);
        }

        private static ReportTargetSnapshotDTO? DeserializeSnapshot(string? snapshotJson)
        {
            if (string.IsNullOrWhiteSpace(snapshotJson))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<ReportTargetSnapshotDTO>(snapshotJson, SnapshotJsonOptions);
            }
            catch
            {
                return null;
            }
        }

        private static string? BuildPreview(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            value = value.Trim();
            return value.Length <= 160 ? value : $"{value[..160]}...";
        }
    }
}
