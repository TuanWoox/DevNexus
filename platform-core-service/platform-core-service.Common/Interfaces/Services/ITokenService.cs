using Microsoft.AspNetCore.Identity;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(ApplicationUser user, IList<string> roles, bool rememberMe = true);
        string GenerateRefreshToken();
        Task<TokenResponseDTO> IssueTokens(ApplicationUser user, bool rememberMe = true);
    }
}
