using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace platform_core_service.Common.Helpers
{
    public static class HelperUtils
    {
        public static bool IsWindow = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? true : false;
        public static readonly DistributedCacheEntryOptions CacheEntryOptions = new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(30) };
        public static string GenerateSlug(string name)
        {
            if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString().Substring(0, 8);

            return name
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("--", "-");
        }
        public static async Task<string> HashFileAsync(IFormFile file)
        {
            using var sha256 = SHA256.Create();
            using var stream = file.OpenReadStream();

            var hashBytes = await sha256.ComputeHashAsync(stream);
            return Convert.ToHexString(hashBytes);
        }
        public static bool BelongsToUser(string storeDestination, string userId)
        {
            var segments = storeDestination.Split(
                new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                StringSplitOptions.RemoveEmptyEntries);
            return segments.Contains(userId);
        }
    }
}

