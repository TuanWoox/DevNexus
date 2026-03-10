using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Attributes;

namespace platform_core_service.Common.Models.DTOs.CoreDTO
{
    public class LoginAccountDTO
    {
        [TrimmedRequired]
        [MinLength(3)]
        [MaxLength(30)]
        public string UserName { get; set; }
        [TrimmedRequired]
        [MinLength(8)]
        [MaxLength(128)]
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}