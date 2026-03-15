using platform_core_service.Common.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.CoreDTO
{
    public class ResetPasswordDTO
    {
        [TrimmedRequired]
        [EmailAddress]
        public string Email { get; set; }

        // token will be URL encoded on the link; client should pass it as received
        [TrimmedRequired]
        public string Token { get; set; }

        [TrimmedRequired]
        [MinLength(12)]
        [MaxLength(128)]
        public string NewPassword { get; set; }
    }
}
