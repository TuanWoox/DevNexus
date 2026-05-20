using platform_core_service.Common.Attributes;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityContentReportService
    {
        public Task<ReturnResult<bool>> ReportContent(ReportContentDTO reportContentDTO);
    }
}
