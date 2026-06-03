namespace platform_core_service.Common.Models.DTOs.HelperDTO
{
    public class AccountModerationStatusDTO
    {
        public bool IsSuspended { get; set; }
        public bool IsPermanentBan { get; set; }
        public DateTimeOffset? SuspendedUntil { get; set; }
        public string? Reason { get; set; }
    }

    public class ReturnResult<T>
    {
        public T Result { get; set; }
        public string Message { get; set; }
        public AccountModerationStatusDTO? ModerationStatus { get; set; }

    }
    public class ReturnSearchResult<T> : ReturnResult<T>
    {
        public int Total { get; set; }
    }
}
