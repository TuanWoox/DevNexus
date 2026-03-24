using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem
{
    public class CreateBookMarkedItem
    {
        [Required]
        public string BookMarkId { get; set; } = null!;

        public string? PostId { get; set; }
        public string? QAPostId { get; set; }
    }
}
