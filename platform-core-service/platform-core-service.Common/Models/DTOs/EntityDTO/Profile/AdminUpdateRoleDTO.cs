using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Profile
{
    public class AdminUpdateRoleDTO
    {
        [Required]
        public string NewRole { get; set; } = null!;
    }
}
