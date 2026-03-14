using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAccountService
    {
        public Task<ReturnResult<bool>> RegisterAccount(RegisterAccountDTO newAccount);
        public Task<ReturnResult<TokenResponseDTO>> LoginAccount(LoginAccountDTO loginAccount);
        public Task<ReturnResult<TokenResponseDTO>> RefreshToken(RefreshTokenDTO refreshTokenDTO);
        public Task<ReturnResult<bool>> Logout();
        public Task<ReturnResult<bool>> ChangePassword(ChangePasswordDTO changePasswordDTO);
    }
}