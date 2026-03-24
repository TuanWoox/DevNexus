using platform_core_service.Common.Attributes;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.BookMark
{
    public class UpdateBookMark
    {
        [TrimmedRequired]
        public string Id { get; set; } = null!;

        [TrimmedRequired]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 200 characters")]
        public string Name { get; set; } = null!;
    }
}
