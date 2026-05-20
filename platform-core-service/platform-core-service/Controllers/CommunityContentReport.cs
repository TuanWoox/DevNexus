using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Factories;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
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

        [HttpPost]
        public async Task<IActionResult> ReportContent(ReportContentDTO reportContentDTO)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var service = _communityContentReportServiceFactory.GetCommunityContentReportService(reportContentDTO.ContentType);
                returnResult = await service.ReportContent(reportContentDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
