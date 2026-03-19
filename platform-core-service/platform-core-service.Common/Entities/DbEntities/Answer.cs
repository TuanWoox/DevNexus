using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.DbEntities;

public class Answer : BaseEntity<string>
{
    [Required]
    [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
    public string Content { get; set; }

    public bool IsAccepted { get; set; } = false;
    public int UpvoteCount { get; set; } = 0;
    public int DownvoteCount { get; set; } = 0;

    [Required]
    public string QAPostId { get; set; }
    [JsonIgnore]
    public QAPost QAPost { get; set; }

    [Required]
    public string AuthorId { get; set; }
    [JsonIgnore]
    public Profile Author { get; set; }

}