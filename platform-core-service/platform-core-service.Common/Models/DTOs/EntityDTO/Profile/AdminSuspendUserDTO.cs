namespace platform_core_service.Common.Models.DTOs.EntityDTO.Profile
{
    public class AdminSuspendUserDTO
    {
        /// <summary>
        /// Number of days to suspend from now. Null means indefinite suspension until manually unsuspended.
        /// </summary>
        public int? DaySuspend { get; set; }
        public string? Reason { get; set; }
    }
}
