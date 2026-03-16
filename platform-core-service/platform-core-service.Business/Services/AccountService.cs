using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.CoreDTO.Account;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Data;
using shared_contracts.Interfaces;
using shared_contracts.Models.DTOs.HelperDTO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

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

        public AccountService(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ApplicationDbContext context,
            IUserContext userContext,
            IBackgroundJobClient backgroundJobClient,
            IConfigurationService configurationService,
            IWebHostEnvironment env
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
        }

        public async Task<ReturnResult<bool>> RegisterAccount(RegisterAccountDTO newAccount)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();

            try
            {
                
                // Create new ApplicationUser
                var user = new ApplicationUser
                {
                    UserName = newAccount.UserName,
                    DateCreated = DateTimeOffset.UtcNow,
                    Email = newAccount.Email,
                    Deleted = false
                };

                if(_env.IsDevelopment())
                {
                    user.EmailConfirmed = true; // Auto-confirm email in development for easier testing
                }

                // Create user with password
                var result = await _userManager.CreateAsync(user, newAccount.Password);

                if (result.Succeeded)
                {
                    // Add Developer role to the new user
                    var roleResult = await _userManager.AddToRoleAsync(user, "Developer");

                    if (!roleResult.Succeeded)
                    {
                        var roleErrors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                        returnResult.Result = false;
                        returnResult.Message = $"User created but failed to assign role: {roleErrors}";
                    }
                    else
                    {
                        if (_env.IsDevelopment())
                        {
                            returnResult.Result = true;
                        }
                        else
                        {
                            //Send confirmation email
                            returnResult = await RequestConfirmEmail(new RequestConfirmEmailDTO { Email = user.Email! });
                        }  
                    }
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    returnResult.Result = false;
                    returnResult.Message = $"Registration failed: {errors}";
                }
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
            ReturnResult<TokenResponseDTO> returnResult = new ReturnResult<TokenResponseDTO>();

            try
            {
                // Find user by username or email
                var user = await _userManager.FindByNameAsync(loginAccount.UserName);

                if (user == null)
                {
                    user = await _userManager.FindByEmailAsync(loginAccount.UserName);
                }

                if (user == null)
                {
                    returnResult.Result = default!;
                    returnResult.Message = "Invalid username or password.";
                    return returnResult;
                }

                // Check password
                var result = await _signInManager.CheckPasswordSignInAsync(user, loginAccount.Password, lockoutOnFailure: true);

                if (result.Succeeded)
                {
                    // Get user roles
                    var roles = await _userManager.GetRolesAsync(user);

                    // Generate JWT access token
                    var accessToken = GenerateAccessToken(user, roles, loginAccount.RememberMe);

                    // Generate refresh token
                    var refreshToken = GenerateRefreshToken();

                    ApplicationUser? correctUserr = await _context.Users.Where(x => x.UserName == loginAccount.UserName).FirstOrDefaultAsync();
                    if (correctUserr != null)
                    {
                        correctUserr.RefreshToken = refreshToken;
                        correctUserr.RefreshTokenValidity = DateTime.UtcNow.AddDays(15);

                        await _context.SaveChangesAsync();
                    }
                    returnResult.Result = new TokenResponseDTO
                    {
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                    };
                }
                else if (result.IsLockedOut)
                {
                    returnResult.Message = "Account is locked due to multiple failed login attempts. Please try again later.";
                }
                //Not confirm the email yet
                else if(result.IsNotAllowed)
                {
                    //Send confirmation email
                    await RequestConfirmEmail(new RequestConfirmEmailDTO { Email = user.Email! });
                    returnResult.Message = "Your account has not been confirmed, please check your email to confirm";
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

        private string GenerateAccessToken(ApplicationUser user, IList<string> roles, bool rememberMe)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add roles to claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Set expiration based on RememberMe: 7 days if true, 1 hour if false
            var expires = rememberMe
                ? DateTime.UtcNow.AddDays(7)
                : DateTime.UtcNow.AddHours(1);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public async Task<ReturnResult<TokenResponseDTO>> RefreshToken(RefreshTokenDTO refreshTokenDTO)
        {
            ReturnResult<TokenResponseDTO> returnResult = new ReturnResult<TokenResponseDTO>();

            try
            {
                // Find user by refresh token
                var user = await _context.Users
                    .FirstOrDefaultAsync(x => x.RefreshToken == refreshTokenDTO.RefreshToken);

                if (user == null)
                {
                    returnResult.Result = default!;
                    returnResult.Message = "Invalid refresh token.";
                    return returnResult;
                }

                // Check if refresh token is expired
                if (user.RefreshTokenValidity == null || user.RefreshTokenValidity < DateTime.UtcNow)
                {
                    returnResult.Result = default!;
                    returnResult.Message = "Refresh token has expired. Please login again.";
                    return returnResult;
                }

                // Get user roles
                var roles = await _userManager.GetRolesAsync(user);

                // Generate new access token
                var newAccessToken = GenerateAccessToken(user, roles, rememberMe: true);

                // Generate new refresh token
                var newRefreshToken = GenerateRefreshToken();

                // Update refresh token in database
                user.RefreshToken = newRefreshToken;
                user.RefreshTokenValidity = DateTime.UtcNow.AddDays(15);
                await _context.SaveChangesAsync();

                returnResult.Result = new TokenResponseDTO
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken
                };
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
                var resetLink = $"{frontendBase}?email={Uri.EscapeDataString(user.Email)}&token={encodedToken}";

                var subject = "DevNexus - Reset your password";
                
                // Get the email template from setting table in db through it's Key and Group
                var emailTemplate = (await _configurationService.GetOneByKeyAndGroup("FORGOT_PASSWORD_EMAIL", "EMAIL_TEMPLATE")).Result?.Value;

                var emailBody = emailTemplate.Replace("{resetLink}", resetLink)
                                                     .Replace("{userName}", user.UserName ?? "User")
                                                     .Replace("{currentYear}", DateTime.UtcNow.Year.ToString());
                
                // Enqueue background job
                var jobId = _backgroundJobClient.Enqueue<IEmailService>(x => x.SendAsync(user.Email, subject, emailBody));

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
                var user = await _userManager.FindByEmailAsync(resetPasswordDTO.Email);
                // Check if user still exist
                if ( user == null )
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

            } catch (Exception ex)
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

                if(user.EmailConfirmed)
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

                if(emailTemplate == null)
                {
                    returnResult.Result = false;
                    returnResult.Message = "The registration confirmation email template could not be found. Please contact support.";
                    return returnResult;
                }

                var emailBody = emailTemplate.Replace("{confirmationLink}", confirmationLink)
                                                     .Replace("{userName}", user.UserName ?? "User")
                                                     .Replace("{currentYear}", DateTime.UtcNow.Year.ToString());

                // Enqueue background job
                var jobId = _backgroundJobClient.Enqueue<IEmailService>(x => x.SendAsync(user.Email!, subject, emailBody));

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
            catch(Exception ex)
            {
                returnResult.Result = false;
                returnResult.Message = $"An error occurred during email confirmation: {ex.Message}";
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
    }
}