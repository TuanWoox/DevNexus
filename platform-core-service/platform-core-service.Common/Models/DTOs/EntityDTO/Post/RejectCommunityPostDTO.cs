using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class RejectCommunityPostDTO
    {
        [StringLength(1000)]
        public string? Reason { get; set; }
    }
}
