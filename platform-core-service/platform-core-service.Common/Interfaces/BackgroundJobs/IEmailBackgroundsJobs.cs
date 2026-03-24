

using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IEmailBackgroundJobs
    {
        Task<ReturnResult<bool>> SendAsync(string toEmail, string subject, string htmlBody);
    }
}