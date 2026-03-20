using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Vote
{
    public class SelectVoteCountDTO
    {
        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
    }
}
