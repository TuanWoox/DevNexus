using platform_core_service.Common.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Account
{
    public class RequestConfirmEmailDTO
    {
        [TrimmedRequired]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = null!;
    }
}
