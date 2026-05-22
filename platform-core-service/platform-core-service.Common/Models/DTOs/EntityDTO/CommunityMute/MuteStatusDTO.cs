namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute
{
    public class MuteStatusDTO
    {
        public bool IsMuted { get; set; }
        public string? MuteId { get; set; }
        public DateTimeOffset? MutedUntil { get; set; }
        public string? MuteReason { get; set; }
    }
}
