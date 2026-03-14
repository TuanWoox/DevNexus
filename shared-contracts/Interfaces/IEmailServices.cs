using shared_contracts.Models.DTOs.HelperDTO;

namespace shared_contracts.Interfaces
{
    public interface IEmailService
    {
        Task<ReturnResult<bool>> SendAsync(string toEmail, string subject, string htmlBody);
    }
}