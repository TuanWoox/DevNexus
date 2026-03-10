using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace platform_core_service.Business.v1
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        public AccountService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        public async Task<ReturnResult<bool>> RegisterAccount(RegisterAccountDTO newAccount)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();

            try
            {
                // Create new ApplicationUser
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = newAccount.UserName,
                    DateCreated = DateTimeOffset.UtcNow,
                    Deleted = false
                };

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
                        returnResult.Result = true;
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
                // Find user by username
                var user = await _userManager.FindByNameAsync(loginAccount.UserName);

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

                    // Determine expiration time based on RememberMe
                    var expiresAt = loginAccount.RememberMe
                        ? DateTime.UtcNow.AddDays(7)
                        : DateTime.UtcNow.AddHours(1);

                    // Generate JWT access token
                    var accessToken = GenerateAccessToken(user, roles, loginAccount.RememberMe);

                    // Generate refresh token
                    var refreshToken = GenerateRefreshToken();

                    returnResult.Result = new TokenResponseDTO
                    {
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                        ExpiresAt = expiresAt
                    };
                }
                else if (result.IsLockedOut)
                {
                    returnResult.Result = default!;
                    returnResult.Message = "Account is locked due to multiple failed login attempts. Please try again later.";
                }
                else
                {
                    returnResult.Result = default!;
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
    }
}