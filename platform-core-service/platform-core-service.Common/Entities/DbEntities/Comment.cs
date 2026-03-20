using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Comment : BaseEntityVoteValue<string>
    {
        [Required]
        [StringLength(5000, MinimumLength = 1, ErrorMessage = "Comment content cannot be empty.")]
        public string Content { get; set; } = null!;

        [Required]
        public string AuthorId { get; set; } = null!;
        [JsonIgnore]
        public Profile Author { get; set; } = null!;

        public string? PostId { get; set; }
        [JsonIgnore]
        public Post? Post { get; set; }

        public string? AnswerId { get; set; }
        [JsonIgnore]
        public Answer? Answer { get; set; }

        public string? ReplyToCommentId { get; set; }
        [JsonIgnore]
        public Comment? ReplyToComment { get; set; }

        public ICollection<Comment> Replies { get; set; } = new List<Comment>();
        public ICollection<Vote> Votes { get; set; } = new List<Vote>(); 
    }
}