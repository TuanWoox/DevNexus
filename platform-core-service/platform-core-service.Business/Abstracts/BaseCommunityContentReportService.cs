using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
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
        where TReportEntity : BaseEntity<string>, new()
        where TReportDTO : IBaseKey<string>
    {

        protected readonly ApplicationDbContext _context;
        protected readonly IUserContext _userContext;
        protected readonly IRepository<TReportEntity, string> _repository;
        protected readonly ISocialGuardService _socialGuardService;

        protected BaseCommunityContentReportService(ApplicationDbContext context, IUserContext userContext, IRepository<TReportEntity, string> repository, ISocialGuardService socialGuardService)
        {
            _context = context;
            _userContext = userContext;
            _repository = repository;
            _socialGuardService = socialGuardService;
        }

        protected abstract DbSet<TReportEntity> GetReportDbSet();
        protected abstract Task<TEntity?> GetEntity(string contentId, string communityId);
        protected abstract TReportEntity CreateReportContent(string communityId, ReportContentDTO reportContentDTO, TEntity entity);
        protected abstract IQueryable<TReportEntity> BuildQueryForPaging(string communityId, string? userId);
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

                if(await _context.SaveChangesAsync() > 0) returnResult.Result = true;
                else returnResult.Message = "Failed to create report.";
          
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred while creating report: {ex.Message}";
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
            if (page.Filter.Count == 0)
            {
                //Take the report that have not been resolved yet, so admin and moderator can see the report that need to be resolved first
                page.Filter.Add(new FilterMapping
                {
                    Prop = "ResolutionAction",
                    Value = ReportResolutionAction.None,
                    FilterOperator = NumberFilterOperator.IsEqualTo,
                    FilterType = FilterType.Number
                });
            }

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
    }
}
