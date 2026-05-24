using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Interfaces.Factories
{
    public interface ICommunityContentReportServiceFactory
    {
        ICommunityContentReportService GetCommunityContentReportService(ContentType contentType);
    }
}
