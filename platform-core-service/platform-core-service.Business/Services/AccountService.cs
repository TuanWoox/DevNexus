using Google.Apis.Auth;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Account;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Net.Http.Json;
using platform_core_service.Common.Interfaces.BackgroundJobs;

namespace platform_core_service.Business.Services
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IConfigurationService _configurationService;
        private readonly IWebHostEnvironment _env;
        private readonly ITokenService _tokenService;
        private readonly IProfileService _profileService;

        public AccountService(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ApplicationDbContext context,
            IUserContext userContext,
            IBackgroundJobClient backgroundJobClient,
            IConfigurationService configurationService,
            IWebHostEnvironment env,
            ITokenService tokenService,
            IProfileService profileService
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _context = context;
            _userContext = userContext;
            _backgroundJobClient = backgroundJobClient;
            _configurationService = configurationService;
            _env = env;
            _tokenService = tokenService;
            _profileService = profileService;
        }

        public async Task<ReturnResult<bool>> RegisterAccount(RegisterAccountDTO newAccount)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var user = new ApplicationUser
                {
                    UserName = newAccount.UserName,
                    Email = newAccount.Email,
                    DateCreated = DateTimeOffset.UtcNow,
                    Deleted = false,
                    // EmailConfirmed = _env.IsDevelopment() // Auto-confirm in development
                    EmailConfirmed = true,
                };

                var createResult = await _userManager.CreateAsync(user, newAccount.Password);
                if (!createResult.Succeeded)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Registration failed: " +
                        string.Join(", ", createResult.Errors.Select(e => e.Description));
                    return returnResult;
                }

                var roleResult = await _userManager.AddToRoleAsync(user, "Developer");
                if (!roleResult.Succeeded)
                {
                    returnResult.Result = false;
                    returnResult.Message = "User created but failed to assign role: " +
                        string.Join(", ", roleResult.Errors.Select(e => e.Description));
                    return returnResult;
                }

                // Create profile during registration
                var profileResult = await _profileService.CreateAsync(newAccount.OnboardInformation, user);
                if (!profileResult.Result)
                {
                    returnResult.Result = false;
                    returnResult.Message = $"User created but failed to create profile: {profileResult.Message}";
                    return returnResult;
                }

                // if (_env.IsDevelopment())
                // {
                //     returnResult.Result = true;
                // }
                // else
                // {
                //     returnResult = await RequestConfirmEmail(new RequestConfirmEmailDTO { Email = user.Email! });
                // }

                returnResult.Result = true;

            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during registration: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<TokenResponseDTO>> LoginAccount(LoginAccountDTO loginAccount)
        {
            ReturnResult<TokenResponseDTO> returnResult = new();
            try
            {
                var user = await _userManager.FindByNameAsync(loginAccount.UserName)
                           ?? await _userManager.FindByEmailAsync(loginAccount.UserName);

                if (user == null)
                {
                    returnResult.Message = "Invalid username or password.";
                    return returnResult;
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, loginAccount.Password, lockoutOnFailure: true);

                if (result.Succeeded)
                {
                    returnResult.Result = await _tokenService.IssueTokens(user, loginAccount.RememberMe);
                }
                else if (result.IsLockedOut)
                {
                    returnResult.Message = "Account is locked due to multiple failed login attempts. Please try again later.";
                }
                else if (result.IsNotAllowed)
                {
                    await RequestConfirmEmail(new RequestConfirmEmailDTO { Email = user.Email! });
                    returnResult.Message = "Your account has not been confirmed, please check your email to confirm.";
                }
                else
                {
                    returnResult.Message = "Invalid username or password.";
                }
            }
            catch (Exception ex)
            {
                returnResult.Result = default!;
                returnResult.Message = $"An error occurred during login: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<TokenResponseDTO>> RefreshToken(RefreshTokenDTO refreshTokenDTO)
        {
            ReturnResult<TokenResponseDTO> returnResult = new();
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(x => x.RefreshToken == refreshTokenDTO.RefreshToken);

                if (user == null)
                {
                    returnResult.Message = "Invalid refresh token.";
                    return returnResult;
                }

                if (user.RefreshTokenValidity == null || user.RefreshTokenValidity < DateTime.UtcNow)
                {
                    returnResult.Message = "Refresh token has expired. Please login again.";
                    return returnResult;
                }

                returnResult.Result = await _tokenService.IssueTokens(user, rememberMe: true);
            }
            catch (Exception ex)
            {
                returnResult.Result = default!;
                returnResult.Message = $"An error occurred during token refresh: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> Logout()
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();

            try
            {
                // Find user by refresh token
                var user = await _context.Users
                    .FirstOrDefaultAsync(x => x.Id == _userContext.UserId);

                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "User", _userContext.UserId);
                    return returnResult;
                }

                // Clear refresh token
                user.RefreshToken = null;
                user.RefreshTokenValidity = null;
                await _context.SaveChangesAsync();

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during logout: {ex.Message}";
            }

            return returnResult;
        }

        public async Task<ReturnResult<bool>> ChangePassword(ChangePasswordDTO changePasswordDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();

            try
            {
                // Get the current user from JWT, with _userContext.UserId set from JWT claims
                if (string.IsNullOrEmpty(_userContext.UserId))
                {
                    returnResult.Result = false;
                    returnResult.Message = "User is not authenticated.";
                    return returnResult;
                }

                var user = await _userManager.FindByIdAsync(_userContext.UserId);
                // Validate if user is still in database
                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "User not found.";
                    return returnResult;
                }

                var isOldPasswordValid = await _userManager.CheckPasswordAsync(user, changePasswordDTO.OldPassword);
                // Validate if old password correct
                if (!isOldPasswordValid)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Old password is incorrect.";
                    return returnResult;
                }

                var isSamePassword = changePasswordDTO.OldPassword == changePasswordDTO.NewPassword;
                // Validate if old password is similar to new password
                if (isSamePassword)
                {
                    returnResult.Result = false;
                    returnResult.Message = "New password must be different from old password.";
                    return returnResult;
                }

                var changeResult = await _userManager.ChangePasswordAsync(user, changePasswordDTO.OldPassword, changePasswordDTO.NewPassword);
                // Use built-in method ChangePasswordAsync instead of doing it manually 
                if (!changeResult.Succeeded)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Password change failed: " +
                          string.Join(",", changeResult.Errors.Select(e => e.Description));
                    return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during password change: {ex.Message}";
            }

            return returnResult;
        }

        public async Task<ReturnResult<bool>> RequestResetPassword(RequestResetPasswordDTO requestResetPasswordDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();

            try
            {
                var user = await _userManager.FindByEmailAsync(requestResetPasswordDTO.Email);

                // Check if user still in db
                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "No account found matching this email address. Please try again.";
                    return returnResult;
                }

                // Generate token and build frontend reset URL
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = Uri.EscapeDataString(token);

                // Config frontend reset URL (we will get it from setting table in db through it's Key and Group)
                var frontendBase = (await _configurationService.GetOneByKeyAndGroup("PASSWORD_RESET_URL", "FRONT_END")).Result?.Value;

                var encodedEmail = Uri.EscapeDataString(user.Email);

                var resetLink = $"{frontendBase}?email={encodedEmail}&token={encodedToken}";

                var subject = "DevNexus - Reset your password";

                // Get the email template from setting table in db through it's Key and Group
                var emailTemplate = (await _configurationService.GetOneByKeyAndGroup("FORGOT_PASSWORD_EMAIL", "EMAIL_TEMPLATE")).Result?.Value;

                if (emailTemplate == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "The reset password email template could not be found. Please contact support.";
                    return returnResult;
                }

                var emailBody = emailTemplate.Replace("{resetLink}", resetLink)
                                                     .Replace("{userName}", user.UserName ?? "User")
                                                     .Replace("{currentYear}", DateTime.UtcNow.Year.ToString());

                // Enqueue background job
                var jobId = _backgroundJobClient.Enqueue<IEmailBackgroundJobs>(x => x.SendAsync(user.Email, subject, emailBody));

                // Check if job is enqueue (return true if job is enqueue)
                if (string.IsNullOrEmpty(jobId))
                {
                    returnResult.Result = false;
                    returnResult.Message = "Failed to send email. Please try again later.";
                    return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during request reset password: {ex.Message}";
            }

            return returnResult;
        }

        public async Task<ReturnResult<bool>> ResetPassword(ResetPasswordDTO resetPasswordDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                var email = Uri.UnescapeDataString(resetPasswordDTO.Email);
                var user = await _userManager.FindByEmailAsync(email);
                // Check if user still exist
                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "No account found matching this email address. Please try again.";
                    return returnResult;
                }

                var token = Uri.UnescapeDataString(resetPasswordDTO.Token);

                var resetResult = await _userManager.ResetPasswordAsync(user, token, resetPasswordDTO.NewPassword);

                if (!resetResult.Succeeded)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Reset failed: " + string.Join(", ", resetResult.Errors.Select(e => e.Description));
                    return returnResult;
                }

                returnResult.Result = true;

            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during reset password: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> RequestConfirmEmail(RequestConfirmEmailDTO requestConfirmEmailDTO)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                var user = await _userManager.FindByEmailAsync(requestConfirmEmailDTO.Email);

                // Check if user still in db
                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "No account found matching this email address. Please try again.";
                    return returnResult;
                }

                if (user.EmailConfirmed)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Email is already confirmed.";
                    return returnResult;
                }

                // Generate token and encode it to escape special characters
                var encodedToken = Uri.EscapeDataString(await _userManager.GenerateEmailConfirmationTokenAsync(user));

                // Config frontend reset URL (we will get it from setting table in db through it's Key and Group)
                var frontendBase = (await _configurationService.GetOneByKeyAndGroup("REGISTRATION_CONFIRMATION_URL", "FRONT_END")).Result?.Value;
                var confirmationLink = $"{frontendBase}?userId={Uri.EscapeDataString(user.Id)}&token={encodedToken}";

                var subject = "DevNexus - Registration Confirmation";

                // Get the email template from setting table in db through it's Key and Group
                var emailTemplate = (await _configurationService.GetOneByKeyAndGroup("REGISTRATION_CONFIRMATION_EMAIL", "EMAIL_TEMPLATE")).Result?.Value;

                if (emailTemplate == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "The registration confirmation email template could not be found. Please contact support.";
                    return returnResult;
                }

                var emailBody = emailTemplate.Replace("{confirmationLink}", confirmationLink)
                                                     .Replace("{userName}", user.UserName ?? "User")
                                                     .Replace("{currentYear}", DateTime.UtcNow.Year.ToString());

                // Enqueue background job
                var jobId = _backgroundJobClient.Enqueue<IEmailBackgroundJobs>(x => x.SendAsync(user.Email!, subject, emailBody));

                // Check if job is enqueue (return true if job is enqueue)
                if (string.IsNullOrEmpty(jobId))
                {
                    returnResult.Result = false;
                    returnResult.Message = "Failed to send email. Please try again later.";
                    return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during request reset password: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> ConfirmEmail(ConfirmEmailDTO confirmEmail)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                confirmEmail.UserId = Uri.UnescapeDataString(confirmEmail.UserId);
                confirmEmail.Token = Uri.UnescapeDataString(confirmEmail.Token);
                var user = await _userManager.FindByIdAsync(confirmEmail.UserId);
                if (user == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Invalid confirmation link. User not found.";
                    return returnResult;
                }
                var confirmResult = await _userManager.ConfirmEmailAsync(user, confirmEmail.Token);

                if (!confirmResult.Succeeded)
                {
                    returnResult.Result = false;
                    returnResult.Message = "Reset failed: " + string.Join(", ", confirmResult.Errors.Select(e => e.Description));
                    return returnResult;
                }
                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during email confirmation: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<TokenResponseDTO>> GoogleLogin(GoogleAuthenticationDTO googleAuthenticationDTO)
        {
            ReturnResult<TokenResponseDTO> returnResult = new();
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { _configuration["Google:ClientId"] }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(googleAuthenticationDTO.IdToken, settings);
                if (payload == null || string.IsNullOrEmpty(payload.Subject))
                {
                    returnResult.Message = "Invalid Google ID token.";
                    return returnResult;
                }

                var user = await _userManager.FindByEmailAsync(payload.Email);
                if (user != null)
                {
                    if (!user.EmailConfirmed) user.EmailConfirmed = true;
                    returnResult.Result = await _tokenService.IssueTokens(user, rememberMe: true);
                }
                else
                {
                    returnResult = await CreateOAuthUser(payload.Email);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"An error occurred during Google login: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<TokenResponseDTO>> GithubLogin(GitHubAuthenticationDTO dto)
        {
            ReturnResult<TokenResponseDTO> returnResult = new();
            try
            {
                using var http = new HttpClient();
                http.DefaultRequestHeaders.Add("Authorization", $"Bearer {dto.AccessToken}");
                http.DefaultRequestHeaders.Add("User-Agent", "DevNexus");

                var response = await http.GetAsync("https://api.github.com/user");
                if (!response.IsSuccessStatusCode)
                {
                    returnResult.Message = "Invalid GitHub access token.";
                    return returnResult;
                }

                var profile = await response.Content.ReadFromJsonAsync<GitHubProfileDTO>();
                if (profile == null || profile.Id == 0)
                {
                    returnResult.Message = "Failed to retrieve GitHub profile.";
                    return returnResult;
                }

                // GitHub email can be null if user set it to private — fallback to emails endpoint
                var email = profile.Email ?? await GetGitHubPrimaryEmail(http);
                if (string.IsNullOrEmpty(email))
                {
                    returnResult.Message = "Unable to retrieve email from GitHub account.";
                    return returnResult;
                }

                var user = await _userManager.FindByEmailAsync(email);
                if (user != null)
                {
                    if (!user.EmailConfirmed) user.EmailConfirmed = true;
                    returnResult.Result = await _tokenService.IssueTokens(user, rememberMe: true);
                }
                else
                {
                    returnResult = await CreateOAuthUser(email);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"An error occurred during GitHub login: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task InitUser()
        {
            // Only run in development mode
            if (!_env.IsDevelopment())
            {
                return;
            }

            try
            {
                // Get all users with unconfirmed emails
                var unconfirmedUsers = await _context.Users
                    .Where(u => !u.EmailConfirmed && !u.Deleted)
                    .ToListAsync();

                if (unconfirmedUsers.Count == 0)
                {
                    return;
                }

                // Auto-confirm all unconfirmed emails
                foreach (var user in unconfirmedUsers)
                {
                    user.EmailConfirmed = true;
                }

                // Save changes to database
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error but don't throw to prevent application startup failure
                Console.WriteLine($"An error occurred during InitUser: {ex.Message}");
            }
        }

        private async Task<ReturnResult<TokenResponseDTO>> CreateOAuthUser(string email)
        {
            ReturnResult<TokenResponseDTO> returnResult = new();

            var newUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                DateCreated = DateTimeOffset.UtcNow,
                Deleted = false
            };

            var createResult = await _userManager.CreateAsync(newUser);
            if (!createResult.Succeeded)
            {
                returnResult.Message = "Failed to create account: " +
                    string.Join(", ", createResult.Errors.Select(e => e.Description));
                return returnResult;
            }

            var roleResult = await _userManager.AddToRoleAsync(newUser, "Developer");
            if (!roleResult.Succeeded)
            {
                returnResult.Message = "Account created but failed to assign role: " +
                    string.Join(", ", roleResult.Errors.Select(e => e.Description));
                return returnResult;
            }

            returnResult.Result = await _tokenService.IssueTokens(newUser, rememberMe: true);
            return returnResult;
        }

        private async Task<string?> GetGitHubPrimaryEmail(HttpClient http)
        {
            var response = await http.GetAsync("https://api.github.com/user/emails");
            if (!response.IsSuccessStatusCode) return null;

            var emails = await response.Content.ReadFromJsonAsync<List<GitHubEmailDTO>>();
            return emails?.FirstOrDefault(e => e.Primary && e.Verified)?.Email;
        }
    }
}