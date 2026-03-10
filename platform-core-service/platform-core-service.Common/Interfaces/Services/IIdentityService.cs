namespace platform_core_service.Common.Interfaces.Services
{
    public interface IIdentityService
    {
        public Task<bool> InitRole();
    }
}