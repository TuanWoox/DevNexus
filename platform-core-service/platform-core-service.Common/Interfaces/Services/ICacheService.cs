using Microsoft.Extensions.Caching.Distributed;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICacheService
    {
        public Task SetCacheAsync<T>(string key, T value, DistributedCacheEntryOptions? options);
        public Task<T?> GetCacheAsync<T>(string key);
        public Task RemoveCacheAsync(string key);
    }
}