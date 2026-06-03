using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.RecommendationDTO
{
    public class UserInterestProfile
    {
        public string ProfileId { get; set; }

        /// <summary>Tag ID → accumulated weight from all profile interactions</summary>
        public Dictionary<string, double> TagWeights { get; set; } = new();

        /// <summary>Author profile IDs the profile follows</summary>
        public HashSet<string> FollowedAuthorIds { get; set; } = new();

        /// <summary>Communities the user is a member of</summary>
        public HashSet<string> CommunityIds { get; set; } = new();

        /// <summary>Top tag IDs by weight (used for finding similar communities/people)</summary>
        public List<string> TopTagIds => TagWeights
                                        .OrderByDescending(kv => kv.Value)
                                        .Take(20)
                                        .Select(kv => kv.Key)
                                        .ToList();

        public bool IsEmpty => TagWeights.Count == 0
                           && FollowedAuthorIds.Count == 0
                           && CommunityIds.Count == 0;
    }
}
