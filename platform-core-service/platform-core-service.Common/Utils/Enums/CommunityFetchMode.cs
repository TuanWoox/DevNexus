namespace platform_core_service.Common.Utils.Enums
{
    public enum CommunityFetchMode
    {
        EXPLORE,   // Communities the user has NOT joined (public/private, excluding owned/joined)
        YOURS,     // Communities the user owns, moderates, or is a member of (merged MANAGED + JOINED)
        ALL        // All communities the user is not banned from (useful for global search)
    }
}
