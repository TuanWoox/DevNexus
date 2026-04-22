using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia
{
    public class CreateCommunityMediaDTO
    {
        [Required]
        public IFormFile File { get; set; } = null!;
        [Required]
        public string CommunityId { get; set; } = null!;
    }
}
