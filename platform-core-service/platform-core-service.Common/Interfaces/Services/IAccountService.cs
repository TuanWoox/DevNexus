using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAccountService
    {
        public Task<ReturnResult<bool>> RegisterAccount(RegisterAccountDTO newAccount);
        public Task<ReturnResult<TokenResponseDTO>> LoginAccount(LoginAccountDTO loginAccount);
    }
}