using System.Security.Cryptography;
using System.Text;

namespace platform_core_service.Common.Utils
{
    public static class ModerationContentHashHelper
    {
        public static string Compute(string? title, string? content)
        {
            var normalized = $"{Normalize(title)}\n\n{Normalize(content)}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string Normalize(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }
    }
}
