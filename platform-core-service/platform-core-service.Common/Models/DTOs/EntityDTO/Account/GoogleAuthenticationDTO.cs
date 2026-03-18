using System.ComponentModel.DataAnnotations;


namespace platform_core_service.Common.Models.DTOs.EntityDTO.Account
{
    public class GoogleAuthenticationDTO
    {
        [Required(ErrorMessage = "IdToken is required.")]
        [MinLength(10, ErrorMessage = "IdToken seems invalid.")]
        public string IdToken { get; set; } = string.Empty;
    }
}
