using Microsoft.AspNetCore.Identity;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.CoreDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.v1
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AccountService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
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
    }
}