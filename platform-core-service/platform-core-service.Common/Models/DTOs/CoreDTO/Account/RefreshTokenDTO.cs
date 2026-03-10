using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.CoreDTO
{
    public class RefreshTokenDTO
    {
        [Required]
        public string RefreshToken { get; set; }
    }
}
