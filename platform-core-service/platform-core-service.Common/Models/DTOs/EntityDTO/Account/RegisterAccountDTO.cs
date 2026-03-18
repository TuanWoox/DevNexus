using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Account
{
    public class RegisterAccountDTO
    {
        [TrimmedRequired]
        [MinLength(3)]
        [MaxLength(30)]
        public string UserName { get; set; }

        [TrimmedRequired]
        [MinLength(12)]
        [MaxLength(128)]
        public string Password { get; set; }

        [TrimmedRequired]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; }

        [Required]
        public CreateProfileDTO OnboardInformation { get; set; }
    }
}