namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock
{
    public class SelectBlockStatus
    {
        public bool IBlockedThem { get; set; }
        public string? BlockId { get; set; }
        public bool TheyBlockedMe { get; set; }
    }
}
