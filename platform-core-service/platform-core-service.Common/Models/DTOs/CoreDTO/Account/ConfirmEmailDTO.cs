using System.ComponentModel.DataAnnotations;


namespace platform_core_service.Common.Models.DTOs.CoreDTO.Account
{
    public class ConfirmEmailDTO
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-Z0-9\-]+$", ErrorMessage = "Invalid UserId format.")]
        public string UserId { get; set; } = null!;

        [Required]
        [StringLength(500, MinimumLength = 20)]
        [DataType(DataType.Text)]
        public string Token { get; set; } = null!;
    }
}
