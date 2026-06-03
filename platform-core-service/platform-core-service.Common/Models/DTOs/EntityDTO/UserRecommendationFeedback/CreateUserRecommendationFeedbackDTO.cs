using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.UserRecommendationFeedback
{
    public class CreateUserRecommendationFeedbackDTO
    {
        public string? PostId { get; set; }
        public string? QAPostId { get; set; }
        public string? CommunityId { get; set; }
        public string FeedbackType { get; set; } = "not_interested";
    }
}
