using platform_core_service.Common.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Account
{
    public class ChangePasswordDTO
    {
        [TrimmedRequired]
        [MinLength(12)]
        [MaxLength(128)]
        public string OldPassword { get; set; }

        [TrimmedRequired]
        [MinLength(12)]
        [MaxLength(128)]
        public string NewPassword { get; set; }

        [TrimmedRequired]
        [MinLength(12)]
        [MaxLength(128)]
        [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; }
    }
}
