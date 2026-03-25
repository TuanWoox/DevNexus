using System;
using System.Collections.Generic;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Comment
{
    public class SelectCommentDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;

        public string Content { get; set; } = null!;

        public string AuthorId { get; set; } = null!;

        public string? PostId { get; set; }

        public string? AnswerId { get; set; }

        public string? ReplyToCommentId { get; set; }

        public int UpvoteCount { get; set; } = 0;

        public int DownvoteCount { get; set; } = 0;

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset? DateModified { get; set; }

        public SelectCommentAuthorDTO? Author { get; set; }

        public List<SelectCommentDTO> Replies { get; set; } = new List<SelectCommentDTO>();
    }

    public class SelectCommentAuthorDTO
    {
        public string Id { get; set; } = null!;

        public string FirstName { get; set; } = null!;

        public string LastName { get; set; } = null!;
    }
}
