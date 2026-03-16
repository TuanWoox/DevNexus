using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.CoreDTO.Account;
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
        public Task<ReturnResult<bool>> RequestResetPassword(RequestResetPasswordDTO requestResetPasswordDTO);
        public Task<ReturnResult<bool>> ResetPassword(ResetPasswordDTO resetPasswordDTO);
        public Task<ReturnResult<bool>> RequestConfirmEmail(RequestConfirmEmailDTO emailConfirmDTO);
        public Task<ReturnResult<bool>> ConfirmEmail(ConfirmEmailDTO confirmEmailDTO);
        public Task InitUser();
    }
}