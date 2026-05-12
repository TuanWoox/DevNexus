using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Community
{
    /// <summary>
    /// Extends the standard Page payload with a FetchMode that controls
    /// which subset of communities the paging API returns.
    /// </summary>
    public class CommunityPageRequest : Page<string>
    {
        /// <summary>
        /// EXPLORE — communities the user has NOT joined (public/private, excluding owned/joined)
        /// YOURS   — communities the user owns, moderates, or is a member of
        /// </summary>
        public CommunityFetchMode FetchMode { get; set; } = CommunityFetchMode.EXPLORE;
    }
}
