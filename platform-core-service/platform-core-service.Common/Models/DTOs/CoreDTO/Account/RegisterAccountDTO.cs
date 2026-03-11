using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Attributes;

namespace platform_core_service.Common.Models.DTOs.CoreDTO
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
    }
}