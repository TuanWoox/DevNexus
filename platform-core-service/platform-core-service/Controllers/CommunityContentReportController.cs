using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Factories;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityAnswersReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityCommentsReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityPostsReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityQAPostReports;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunityContentReport : ControllerBase
    {
        ICommunityContentReportServiceFactory _communityContentReportServiceFactory;

        public CommunityContentReport(ICommunityContentReportServiceFactory communityContentReportServiceFactory)
        {
            _communityContentReportServiceFactory = communityContentReportServiceFactory;
        }

        [HttpPost("{communityId}")]
        public async Task<IActionResult> ReportContent(string communityId, [FromBody] ReportContentDTO reportContentDTO)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var service = _communityContentReportServiceFactory.GetCommunityContentReportService(reportContentDTO.ContentType);
                returnResult = await service.ReportContent(communityId, reportContentDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        [HttpPost("{communityId}/{contentType}/admin-moderator/paging")]
        public async Task<IActionResult> GetPagingDataForAdminAndModerator(string communityId, ContentType contentType, [FromBody] Page<string> page)
        {
            try
            {
                var service = _communityContentReportServiceFactory.GetCommunityContentReportService(contentType);
                return contentType switch
                {
                    ContentType.Post => Ok(await service.GetPagingDataForAdminAndModerator<SelectCommunityPostsReportDTO>(page, communityId)),
                    ContentType.QA => Ok(await service.GetPagingDataForAdminAndModerator<SelectCommunityQAPostReportsDTO>(page, communityId)),
                    ContentType.Answer => Ok(await service.GetPagingDataForAdminAndModerator<SelectCommunityAnswersReportDTO>(page, communityId)),
                    ContentType.Comment => Ok(await service.GetPagingDataForAdminAndModerator<SelectCommunityCommentsReportDTO>(page, communityId)),
                    _ => Ok(new ReturnResult<bool> { Message = "Unsupported content type." })
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                return Ok(new ReturnResult<bool> { Message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{communityId}/{contentType}/mine/paging")]
        public async Task<IActionResult> GetPagingDataForCurrentUser(string communityId, ContentType contentType, [FromBody] Page<string> page)
        {
            try
            {
                var service = _communityContentReportServiceFactory.GetCommunityContentReportService(contentType);
                return contentType switch
                {
                    ContentType.Post => Ok(await service.GetPagingDataForCurrentUser<SelectCommunityPostsReportDTO>(page, communityId)),
                    ContentType.QA => Ok(await service.GetPagingDataForCurrentUser<SelectCommunityQAPostReportsDTO>(page, communityId)),
                    ContentType.Answer => Ok(await service.GetPagingDataForCurrentUser<SelectCommunityAnswersReportDTO>(page, communityId)),
                    ContentType.Comment => Ok(await service.GetPagingDataForCurrentUser<SelectCommunityCommentsReportDTO>(page, communityId)),
                    _ => Ok(new ReturnResult<bool> { Message = "Unsupported content type." })
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                return Ok(new ReturnResult<bool> { Message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}
