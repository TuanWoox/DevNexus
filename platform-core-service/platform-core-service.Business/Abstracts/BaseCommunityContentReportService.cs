using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
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

        protected BaseCommunityContentReportService(ApplicationDbContext context, IUserContext userContext, IRepository<TReportEntity, string> repository, ISocialGuardService socialGuardService, ICommunityBanService banService)
        {
            _context = context;
            _userContext = userContext;
            _repository = repository;
            _socialGuardService = socialGuardService;
            _banService = banService;
        }

        protected abstract DbSet<TReportEntity> GetReportDbSet();
        protected abstract Task<TEntity?> GetEntity(string contentId, string communityId);
        protected abstract TReportEntity CreateReportContent(string communityId, ReportContentDTO reportContentDTO, TEntity entity);
        protected abstract IQueryable<TReportEntity> BuildQueryForPaging(string communityId, string? userId);
        protected abstract string GetContentIdFromReport(TReportEntity report);
        protected abstract Task<List<TReportEntity>> GetAllPendingReportsForContent(string contentId, string communityId);
        protected abstract Task SoftDeleteContent(TEntity content);
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

                if (await _context.SaveChangesAsync() > 0) returnResult.Result = true;
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
                        var banResult = await _banService.BanMemberAsync(new CreateCommunityBanDTO
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

                await _context.SaveChangesAsync();
                returnResult.Result = true;
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
    }
}
