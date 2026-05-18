using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.HelperDTO
{
    public class CreateVideoUploadDTO
    {
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = null!;

        [Required]
        [StringLength(64, MinimumLength = 64, ErrorMessage = "Hash must be a valid SHA256 string.")]
        [RegularExpression("^[a-fA-F0-9]+$", ErrorMessage = "Hash must be hexadecimal.")]
        public string HashFile { get; set; } = null!;
    }
    public class ContentInitUploadVideoDTO<TSelectMediaDTO>
    {
        public string SessionId { get; set; } = null!;
        public string TempPath { get; set; } = null!;
        public bool IsDuplicate { get; set; }
        public TSelectMediaDTO? ExistingMedia { get; set; }
    }
    public class VideoChunkProgressDTO
    {
        [Range(0, int.MaxValue)]
        public int ReceivedChunks { get; set; }

        [Range(1, int.MaxValue)]
        public int TotalChunks { get; set; }

        public bool IsComplete { get; set; }
    }
    public class MergeVideoChunkDTO
    {
        [Required]
        public string SessionId { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = null!;

        [Range(1, int.MaxValue)]
        public int TotalChunks { get; set; }

        [Required]
        [StringLength(64, MinimumLength = 64)]
        [RegularExpression("^[a-fA-F0-9]+$", ErrorMessage = "Hash must be hexadecimal.")]
        public string FileHash { get; set; } = null!;
    }
    public class UploadVideoChunkDTO
    {
        [Required]
        public string SessionId { get; set; } = null!;

        [Range(0, int.MaxValue, ErrorMessage = "ChunkIndex must be 0 or greater.")]
        public int ChunkIndex { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "TotalChunks must be at least 1.")]
        public int TotalChunks { get; set; }

        [Required(ErrorMessage = "Chunk file is required.")]
        public IFormFile Chunk { get; set; } = null!;
    }
}
