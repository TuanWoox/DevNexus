using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Abstracts
{
    public abstract class BaseCommunityContentReportService<TEntity, TReportEntity> : ICommunityContentReportService
        where TEntity : class
        where TReportEntity : BaseEntity<string>, new()
    {

        protected readonly ApplicationDbContext _context;
        protected readonly IUserContext _userContext;

        protected BaseCommunityContentReportService(ApplicationDbContext context, IUserContext userContext)
        {
            _context = context;
            _userContext = userContext;
        }

        protected abstract DbSet<TReportEntity> GetReportDbSet();
        protected abstract Task<TEntity?> GetEntity(string contentId, string communityId);
        protected abstract TReportEntity CreateReportContent(ReportContentDTO reportContentDTO, TEntity entity);
        public async Task<ReturnResult<bool>> ReportContent(ReportContentDTO reportContentDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>(); 
            try
            {
                var entity = await GetEntity(reportContentDTO.ContentId, reportContentDTO.CommunityId);
                if (entity == null)
                {
                    returnResult.Message = "Content not found.";
                    return returnResult;
                }

                var createdResult = CreateReportContent(reportContentDTO, entity);

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
    }
}
