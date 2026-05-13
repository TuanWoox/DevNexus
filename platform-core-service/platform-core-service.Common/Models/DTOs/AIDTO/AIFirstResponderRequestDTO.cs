using System;
using System.Collections.Generic;

namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    public class AIFirstResponderRequestDTO
    {
        public string PostId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorDisplayName { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class AIFirstResponderResponseDTO
    {
        public bool Success { get; set; }
        public string? GeneratedComment { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
