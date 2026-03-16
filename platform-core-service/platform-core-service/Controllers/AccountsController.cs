using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.CoreDTO.Account;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAccount(RegisterAccountDTO newAccount)
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.RegisterAccount(newAccount);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginAccount(LoginAccountDTO loginAccount)
        {
            ReturnResult<TokenResponseDTO> result = new ReturnResult<TokenResponseDTO>();
            try
            {
                result = await _accountService.LoginAccount(loginAccount);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenDTO refreshTokenDTO)
        {
            ReturnResult<TokenResponseDTO> result = new ReturnResult<TokenResponseDTO>();
            try
            {
                result = await _accountService.RefreshToken(refreshTokenDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.Logout();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDTO changePasswordDTO)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.ChangePassword(changePasswordDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("request-reset-password")]
        public async Task<IActionResult> RequestResetPassword(RequestResetPasswordDTO requestResetPasswordDTO)
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.RequestResetPassword(requestResetPasswordDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDTO resetPasswordDTO)
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.ResetPassword(resetPasswordDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }

        [HttpPost("request-confirm-email")]
        public async Task<IActionResult> RequestConfirmEmail(RequestConfirmEmailDTO requestEmailConfirmDTO)
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.RequestConfirmEmail(requestEmailConfirmDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }
        [HttpPost("email-confirm")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDTO confirmEmailDTO)
        {
            ReturnResult<bool> result = new ReturnResult<bool>();
            try
            {
                result = await _accountService.ConfirmEmail(confirmEmailDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin(GoogleAuthenticationDTO googleAuthenticationDTO)
        {
            ReturnResult<TokenResponseDTO> result = new ReturnResult<TokenResponseDTO>();
            try
            {
                result = await _accountService.GoogleLogin(googleAuthenticationDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }
        [HttpPost("github-login")]
        public async Task<IActionResult> GithubLogin(GitHubAuthenticationDTO gitHubAuthenticationDTO)
        {
            ReturnResult<TokenResponseDTO> result = new ReturnResult<TokenResponseDTO>();
            try
            {
                result = await _accountService.GithubLogin(gitHubAuthenticationDTO);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = ex.Message;
            }
            return Ok(result);
        }
    }
}