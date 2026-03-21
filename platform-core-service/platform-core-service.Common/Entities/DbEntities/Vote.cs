using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Vote
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AuthorId { get; set; } = null!;
        [JsonIgnore]
        public Profile Author { get; set; } = null!;

        public bool IsUpvote { get; set; } 

        public string? PostId { get; set; }
        [JsonIgnore]
        public Post? Post { get; set; }

        public string? AnswerId { get; set; }
        [JsonIgnore]
        public Answer? Answer { get; set; }

        public string? CommentId { get; set; }
        [JsonIgnore]
        public Comment? Comment { get; set; }

        public DateTimeOffset DateCreated { get; set; } = DateTimeOffset.UtcNow;
    }
}