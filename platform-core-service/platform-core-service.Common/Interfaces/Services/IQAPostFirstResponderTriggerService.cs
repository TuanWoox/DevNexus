namespace platform_core_service.Common.Interfaces.Services
{
    public interface IQAPostFirstResponderTriggerService
    {
        Task<bool> TryEnqueueAsync(string qaPostId, string source);
    }
}
