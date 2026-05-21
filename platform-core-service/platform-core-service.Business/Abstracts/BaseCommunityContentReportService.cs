using AutoMapper;
using CloudinaryDotNet.Actions;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.DTOs.PagingDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Abstracts
{
    public abstract class BaseCommunityContentReportService<TEntity, TReportEntity, TReportDTO> : ICommunityContentReportService
        where TEntity : class
        where TReportEntity : BaseCommunityReport, new()
        where TReportDTO : IBaseKey<string>
    {

        protected readonly ApplicationDbContext _context;
        protected readonly IUserContext _userContext;
        protected readonly IRepository<TReportEntity, string> _repository;
        protected readonly ISocialGuardService _socialGuardService;
        protected readonly ICommunityBanService _banService;
        private readonly IBackgroundJobClient _backgroundJobClient;
        protected readonly IMapper _mapper;

        protected BaseCommunityContentReportService(ApplicationDbContext context, IUserContext userContext, IRepository<TReportEntity, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService, IBackgroundJobClient backgroundJobClient, IMapper mapper)
        {
            _context = context;
            _userContext = userContext;
            _repository = repository;
            _socialGuardService = socialGuardService;
            _banService = banService;
            _backgroundJobClient = backgroundJobClient;
            _mapper = mapper;
        }

        protected abstract ContentType ContentType { get; }
        protected abstract DbSet<TReportEntity> GetReportDbSet();
        protected abstract Task<TEntity?> GetEntity(string contentId, string communityId);
        protected abstract TReportEntity CreateReportContent(string communityId, ReportContentDTO reportContentDTO, TEntity entity);
        protected abstract IQueryable<TReportEntity> BuildQueryForPaging(string communityId, string? userId);
        protected abstract string GetContentIdFromReport(TReportEntity report);
        protected abstract Task<List<TReportEntity>> GetAllPendingReportsForContent(string contentId, string communityId);
        protected abstract Task SoftDeleteContent(TEntity content);

        protected virtual IQueryable<TReportEntity> BuildQueryForDetail(string communityId, string reportId)
        {
            return GetReportDbSet()
                .Include(r => r.Reporter)
                .Include(r => r.ReportedProfile)
                .Include(r => r.ResolvedBy)
                .Include(r => r.Community);
        }

        public async Task<ReturnResult<bool>> ReportContent(string communityId, ReportContentDTO reportContentDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                var entity = await GetEntity(reportContentDTO.ContentId, communityId);
                if (entity == null)
                {
                    returnResult.Message = "Content not found.";
                    return returnResult;
                }

                var createdResult = CreateReportContent(communityId, reportContentDTO, entity);

                var reportDbSet = GetReportDbSet();

                await reportDbSet.AddAsync(createdResult);

                if (await _context.SaveChangesAsync() > 0)
                {
                    await PublishReportCreatedNotificationAsync(createdResult, communityId);
                    returnResult.Result = true;
                }
                else returnResult.Message = "Failed to create report.";

            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred while creating report: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> ResolveReport(string communityId, ResolveReportDTO resolveDTO)
        {
            var returnResult = new ReturnResult<bool>();

            var authCheck = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(
                _userContext.ProfileId, communityId);
            if (!authCheck.Result)
            {
                returnResult.Message = "Unauthorized";
                return returnResult;
            }

            var report = await GetReportDbSet()
                .FirstOrDefaultAsync(r => r.Id == resolveDTO.ReportId && r.CommunityId == communityId);

            if (report == null)
            {
                returnResult.Message = "Report not found.";
                return returnResult;
            }

            if (report.Status != ReportStatus.Pending || report.ResolutionAction != ReportResolutionAction.None)
            {
                returnResult.Message = "Report has already been resolved.";
                return returnResult;
            }

            var contentId = GetContentIdFromReport(report);
            var contentEntity = await GetEntity(contentId, communityId);
            if (contentEntity == null)
            {
                returnResult.Message = "Reported content not found.";
                return returnResult;
            }

            try
            {
                switch (resolveDTO.Action)
                {
                    case ReportResolutionAction.Reject:
                        UpdateSingleReport(report, ReportStatus.Rejected, ReportResolutionAction.Reject, resolveDTO.ResolutionNotes);
                        break;

                    case ReportResolutionAction.RemoveContent:
                        var allReportsForRemove = await GetAllPendingReportsForContent(contentId, communityId);
                        await SoftDeleteContent(contentEntity);
                        BulkUpdateReports(allReportsForRemove, ReportStatus.Resolved, ReportResolutionAction.RemoveContent, resolveDTO.ResolutionNotes);
                        break;

                    case ReportResolutionAction.RemoveContentAndMute:
                        var allReportsForMute = await GetAllPendingReportsForContent(contentId, communityId);
                        await SoftDeleteContent(contentEntity);
                        await ApplyMute(report.ReportedProfileId, communityId, resolveDTO);
                        BulkUpdateReports(allReportsForMute, ReportStatus.Resolved, ReportResolutionAction.RemoveContentAndMute, resolveDTO.ResolutionNotes);
                        break;

                    case ReportResolutionAction.RemoveContentAndBan:
                        var allReportsForBan = await GetAllPendingReportsForContent(contentId, communityId);
                        await SoftDeleteContent(contentEntity);
                        var banResult = await _banService.BanMemberAsync(new Common.Models.DTOs.EntityDTO.CommunityMember.CreateCommunityBanDTO
                        {
                            CommunityId = communityId,
                            BannedProfileId = report.ReportedProfileId,
                            BanReason = resolveDTO.ResolutionNotes ?? "Content violation"
                        });
                        if (banResult.Result == null)
                        {
                            throw new InvalidOperationException(banResult.Message ?? "Failed to ban member.");
                        }
                        BulkUpdateReports(allReportsForBan, ReportStatus.Resolved, ReportResolutionAction.RemoveContentAndBan, resolveDTO.ResolutionNotes);
                        break;

                    case ReportResolutionAction.PenalizeReporter:
                        UpdateSingleReport(report, ReportStatus.Rejected, ReportResolutionAction.PenalizeReporter, resolveDTO.ResolutionNotes ?? "False report");
                        await ApplyMute(report.ReporterId, communityId, new ResolveReportDTO
                        {
                            MutedUntil = DateTimeOffset.UtcNow.AddDays(3),
                            ResolutionNotes = "Penalized for false reporting"
                        });
                        break;

                    default:
                        returnResult.Message = "Unsupported resolution action.";
                        return returnResult;
                }

                if (await _context.SaveChangesAsync() > 0)
                {
                    await PublishReportResolvedNotificationsAsync(report, communityId, resolveDTO);
                    returnResult.Result = true;
                }
                else returnResult.Message = "Failed to resolve report.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"Error resolving report: {ex.Message}";
            }

            return returnResult;
        }
        public async Task<ReturnResult<PagedData<TReportEntityDTO, string>>> GetPagingDataForAdminAndModerator<TReportEntityDTO>(Page<string> page, string communityId)
            where TReportEntityDTO : IBaseKey<string>
        {
            var returnResult = new ReturnResult<PagedData<TReportEntityDTO, string>>();
            try
            {
                var isAdminOrModerator = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(_userContext.ProfileId, communityId);
                //Not admin so cant access report data
                if (!isAdminOrModerator.Result)
                {
                    returnResult.Message = "Unauthorized access.";
                    return returnResult;
                }
                var formatedPage = AddFilterAndOrderDefaultToPage(page);
                //Because this is query for admin so we will not filter by userId, we will show all of the data to admin and moderator
                var query = BuildQueryForPaging(communityId, "");
                var pageData = await _repository.GetPagingAsync<Page<string>, TReportEntityDTO>(query, formatedPage);
                returnResult.Result = pageData;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred while fetching report data: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<TReportEntityDTO, string>>> GetPagingDataForCurrentUser<TReportEntityDTO>(Page<string> page, string communityId)
            where TReportEntityDTO : IBaseKey<string>
        {
            var returnResult = new ReturnResult<PagedData<TReportEntityDTO, string>>();
            try
            {
                var formatedPage = AddFilterAndOrderDefaultToPage(page);
                var query = BuildQueryForPaging(communityId, _userContext.ProfileId);
                var pageData = await _repository.GetPagingAsync<Page<string>, TReportEntityDTO>(query, formatedPage);
                returnResult.Result = pageData;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred while fetching report data: {ex.Message}";
            }
            return returnResult;
        }

        Page<string> AddFilterAndOrderDefaultToPage(Page<string> page)
        {
            if (page.Orders.Count == 0)
            {
                //Order by created date desc by default, so the latest report will be on the top
                page.Orders.Add(new OrderMapping
                {
                    Sort = "DateCreated",
                    SortDir = SortOrderType.DESC,
                });
            }
            return page;
        }

        private void UpdateSingleReport(
            TReportEntity report,
            ReportStatus status,
            ReportResolutionAction action,
            string? notes)
        {
            report.Status = status;
            report.ResolvedById = _userContext.ProfileId;
            report.ResolutionAction = action;
            report.ResolutionNotes = notes;
        }

        private void BulkUpdateReports(
            List<TReportEntity> reports,
            ReportStatus status,
            ReportResolutionAction action,
            string? notes)
        {
            foreach (var report in reports)
            {
                report.Status = status;
                report.ResolvedById = _userContext.ProfileId;
                report.ResolutionAction = action;
                report.ResolutionNotes = notes;
            }
        }

        private async Task ApplyMute(string targetProfileId, string communityId, ResolveReportDTO dto)
        {
            var existingMute = await _context.CommunityMutedMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId
                    && m.MutedProfileId == targetProfileId
                    && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow));

            if (existingMute != null)
            {
                existingMute.MutedUntil = dto.MutedUntil;
                existingMute.MuteReason = dto.ResolutionNotes ?? "Content violation";
                existingMute.MutedById = _userContext.ProfileId;
            }
            else
            {
                await _context.CommunityMutedMembers.AddAsync(new CommunityMuteMember
                {
                    CommunityId = communityId,
                    MutedProfileId = targetProfileId,
                    MutedById = _userContext.ProfileId,
                    MuteReason = dto.ResolutionNotes ?? "Content violation",
                    MutedUntil = dto.MutedUntil
                });
            }
        }

        private async Task PublishReportCreatedNotificationAsync(TReportEntity report, string communityId)
        {
            var community = await _context.Communities
                .AsNoTracking()
                .Where(c => c.Id == communityId)
                .Select(c => new { c.Id, c.Name, c.OwnerId, c.CommunityCoverPhotoUrl })
                .FirstOrDefaultAsync();

            if (community == null) return;

            var moderatorIds = await _context.CommunityModerators
                .AsNoTracking()
                .Where(m => m.CommunityId == communityId)
                .Select(m => m.ModeratorId)
                .ToListAsync();

            var recipientIds = moderatorIds
                .Append(community.OwnerId)
                .Distinct()
                .Where(id => id != report.ReporterId)
                .ToList();

            foreach (var recipientId in recipientIds)
            {
                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublicNotification(new NotiicationCreatedEntityDTO
                    {
                        EventType = NotificationEventType.COMMUNITY_REPORT_CREATED,
                        ActorType = ActorType.Community,
                        ActorId = communityId,
                        ActorName = community.Name,
                        ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                        RecipientId = recipientId,
                        EntityType = NotificationEntityType.COMMUNITY,
                        EntityId = communityId,
                        EntityTitle = community.Name,
                        EntityPreview = report.Reason,
                        Message = $"A new report has been filed in \"{community.Name}\".",
                        ActionUrl = $"/communities/{communityId}/reports"
                    }, "notifications.community"));
            }
        }

        public async Task<ReturnResult<TReportDTO>> GetReportByIdAsync<TReportDTO>(string communityId, string reportId)
            where TReportDTO : IBaseKey<string>
        {
            var returnResult = new ReturnResult<TReportDTO>();
            try
            {
                var currentUserId = _userContext.ProfileId;
                var report = await BuildQueryForDetail(communityId, reportId)
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.Id == reportId && (r.CommunityId == communityId || r.Community.Slug == communityId));

                if (report == null)
                {
                    returnResult.Message = "Report not found.";
                    return returnResult;
                }

                var isAuthorized = false;
                if (report.ReporterId == currentUserId || report.ReportedProfileId == currentUserId)
                {
                    isAuthorized = true;
                }
                else
                {
                    var authCheck = await _socialGuardService.CheckIsCommunityAdminOrModeratorAsync(currentUserId, report.CommunityId);
                    isAuthorized = authCheck.Result;
                }

                if (!isAuthorized)
                {
                    returnResult.Message = "Unauthorized access.";
                    return returnResult;
                }

                returnResult.Result = _mapper.Map<TReportDTO>(report);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred while retrieving the report: {ex.Message}";
            }
            return returnResult;
        }

        private async Task PublishReportResolvedNotificationsAsync(
            TReportEntity report,
            string communityId,
            ResolveReportDTO resolveDTO)
        {
            var community = await _context.Communities
                .AsNoTracking()
                .Where(c => c.Id == communityId)
                .Select(c => new { c.Id, c.Name, c.CommunityCoverPhotoUrl })
                .FirstOrDefaultAsync();

            if (community == null) return;

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(new NotiicationCreatedEntityDTO
                {
                    EventType = NotificationEventType.COMMUNITY_REPORT_RESOLVED,
                    ActorType = ActorType.Community,
                    ActorId = communityId,
                    ActorName = community.Name,
                    ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                    RecipientId = report.ReporterId,
                    EntityType = NotificationEntityType.COMMUNITY,
                    EntityId = communityId,
                    EntityTitle = community.Name,
                    Message = $"Your report in \"{community.Name}\" has been reviewed. Thank you for keeping the community safe.",
                    ActionUrl = $"/communities/{communityId}/content-report/{report.Id}?type={(int)ContentType}"
                }, "notifications.community"));

            var offenderMessage = resolveDTO.Action switch
            {
                ReportResolutionAction.RemoveContent =>
                    $"Your content in \"{community.Name}\" was removed for violating community guidelines.",

                ReportResolutionAction.RemoveContentAndMute =>
                    $"Your content in \"{community.Name}\" was removed and you have been muted until {resolveDTO.MutedUntil?.ToString("g") ?? "further notice"}.",

                ReportResolutionAction.RemoveContentAndBan =>
                    $"Your content in \"{community.Name}\" was removed and you have been permanently banned.",

                ReportResolutionAction.PenalizeReporter =>
                    $"You have been muted in \"{community.Name}\" for 3 days for filing a false report.",

                _ => null
            };

            if (offenderMessage == null) return;

            var offenderRecipient = resolveDTO.Action == ReportResolutionAction.PenalizeReporter
                ? report.ReporterId
                : report.ReportedProfileId;

            if (offenderRecipient == report.ReporterId && resolveDTO.Action != ReportResolutionAction.PenalizeReporter)
            {
                return;
            }

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(new NotiicationCreatedEntityDTO
                {
                    EventType = NotificationEventType.COMMUNITY_REPORT_RESOLVED,
                    ActorType = ActorType.Community,
                    ActorId = communityId,
                    ActorName = community.Name,
                    ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                    RecipientId = offenderRecipient,
                    EntityType = NotificationEntityType.COMMUNITY,
                    EntityId = communityId,
                    EntityTitle = community.Name,
                    Message = offenderMessage,
                    ActionUrl = $"/communities/{communityId}/content-report/{report.Id}?type={(int)ContentType}"
                }, "notifications.community"));
        }
    }
}
