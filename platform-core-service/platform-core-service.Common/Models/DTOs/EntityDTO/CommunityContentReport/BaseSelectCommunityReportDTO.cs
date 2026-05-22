using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport
{
    public abstract class BaseSelectCommunityReportDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public SelectCommunityReportCommunityDTO? Community { get; set; }
        public string ReporterId { get; set; } = null!;
        public SelectCommunityReportProfileDTO? Reporter { get; set; }
        public string ReportedProfileId { get; set; } = null!;
        public SelectCommunityReportProfileDTO? ReportedProfile { get; set; }
        public string Reason { get; set; } = null!;
        public ReportStatus Status { get; set; }
        public string? ResolvedById { get; set; }
        public SelectCommunityReportProfileDTO? ResolvedBy { get; set; }
        public string? ResolutionNotes { get; set; }
        public ReportResolutionAction ResolutionAction { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }

    public class SelectCommunityReportProfileDTO
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? BackgroundUrl { get; set; }
        public string? Bio { get; set; }
        public int ReputationPoints { get; set; }
        public List<string> TechStacks { get; set; } = [];
        public bool IsPrivate { get; set; }
    }

    public class SelectCommunityReportCommunityDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? CommunityCoverPhotoUrl { get; set; }
    }
}
