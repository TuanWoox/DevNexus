using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Account
{
    public class GitHubAuthenticationDTO
    {
        [Required(ErrorMessage = "Code is required.")]
        [MinLength(10, ErrorMessage = "Code seems invalid.")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "RedirectUri is required.")]
        [Url(ErrorMessage = "RedirectUri must be a valid URL.")]
        public string RedirectUri { get; set; } = string.Empty;
    }

    public class GitHubAccessTokenResponseDTO
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }

        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("error_description")]
        public string? ErrorDescription { get; set; }
    }

    public class GitHubProfileDTO
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("login")]
        public string Login { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("avatar_url")]
        public string? AvatarUrl { get; set; }
    }

    public class GitHubEmailDTO
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("primary")]
        public bool Primary { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }
    }
}
