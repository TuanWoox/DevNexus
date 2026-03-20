using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Business.Services
{
    /// <summary>
    /// Redis distributed cache wrapper service.
    /// Provides high-level abstraction over IDistributedCache for generic serialization/deserialization.
    /// Handles JSON serialization and graceful error logging without throwing.
    /// </summary>
    public class CacheService : ICacheService
    {
        private readonly IDistributedCache _cache;

        public CacheService(IDistributedCache cache)
        {
            _cache = cache;
        }

        /// <summary>
        /// Retrieves and deserializes a cached value from Redis.
        /// 
        /// Flow:
        /// 1. Attempt to fetch string value from cache by key
        /// 2. If string exists and is not empty, deserialize JSON string to type T
        /// 3. If key not found or empty, return null (default for T?)
        /// 4. On any exception, log to debug and return null (fail gracefully)
        /// 
        /// Return: T? (nullable) — null if not found or on error
        /// </summary>
        public async Task<T?> GetCacheAsync<T>(string key)
        {
            try
            {
                // IDistributedCache stores only strings, so retrieve as string
                string? cachedData = await _cache.GetStringAsync(key);

                // Deserialize only if data exists
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return JsonSerializer.Deserialize<T>(cachedData);
                }
            }
            catch (Exception ex)
            {
                // Log error but don't throw — allow caller to handle null gracefully
                DevNexusLogger.Instance.Debug($"Get Value From Cache Error {ex.Message}");
            }

            // Return null if key not found, empty, or error occurred
            return default;
        }

        /// <summary>
        /// Removes a cached value from Redis.
        /// 
        /// Behavior: Silently logs errors without throwing — cache removal failures
        /// should not break application flow. Key may not exist (no error).
        /// </summary>
        public async Task RemoveCacheAsync(string key)
        {
            try
            {
                await _cache.RemoveAsync(key);
            }
            catch (Exception ex)
            {
                // Log error but don't throw — non-critical operation
                DevNexusLogger.Instance.Debug($"Remove Value From Cache Error {ex.Message}");
            }
        }

        /// <summary>
        /// Stores a serialized value in Redis cache with expiration options.
        /// 
        /// Flow:
        /// 1. Validate that value is not null (null values are not cached)
        /// 2. Serialize T to JSON string
        /// 3. Store string in cache with provided expiration options
        /// 4. On any exception, log to debug and silently fail (no cache = no error)
        /// 
        /// Note: DistributedCacheEntryOptions controls sliding/absolute expiration
        /// </summary>
        public async Task SetCacheAsync<T>(string key, T value, DistributedCacheEntryOptions? options = null)
        {
            try
            {
                // Don't cache null values — they have no meaningful information
                if (value != null)
                {
                    // Serialize object to JSON string for storage
                    string cachedData = JsonSerializer.Serialize(value);

                    // Use provided options or default to 1 hour sliding expiration
                    var cacheOptions = options ?? new DistributedCacheEntryOptions
                    {
                        SlidingExpiration = TimeSpan.FromHours(1)
                    };

                    // Store in cache with expiration options (absolute/sliding expiry)
                    await _cache.SetStringAsync(key, cachedData, cacheOptions);
                }
            }
            catch (Exception ex)
            {
                // Log error but don't throw — cache unavailability should not crash app
                DevNexusLogger.Instance.Debug($"Set Value From Cache Error {ex.Message}");
            }
        }
    }
}
