using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Utils
{
    public static class ModerationContentHashHelper
    {
        private static readonly Regex ContentMediaReferenceRegex = new(
            @"(?:^|[""'\(\s])(?:https?://[^/""'\)\s]+)?(?:/[^""'\)\s]*)?/api/ContentMedia/(?<id>[^?""'\)\s]+)\?(?<query>[^""'\)\s#]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string Compute(string? title, string? content)
        {
            var normalized = $"{Normalize(title)}\n\n{Normalize(content)}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public static IReadOnlyList<ContentMediaReference> ExtractContentMediaReferences(string? content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return [];
            }

            var references = new List<ContentMediaReference>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match match in ContentMediaReferenceRegex.Matches(content))
            {
                var mediaId = Uri.UnescapeDataString(match.Groups["id"].Value.Trim());
                var query = match.Groups["query"].Value.Replace("&amp;", "&", StringComparison.OrdinalIgnoreCase);
                var contentTypeValue = ExtractQueryValue(query, "contentType");

                if (string.IsNullOrWhiteSpace(mediaId) ||
                    string.IsNullOrWhiteSpace(contentTypeValue) ||
                    !TryParseContentType(contentTypeValue, out var contentType))
                {
                    continue;
                }

                var key = $"{contentType}:{mediaId}";
                if (seen.Add(key))
                {
                    references.Add(new ContentMediaReference(mediaId, contentType));
                }
            }

            return references
                .OrderBy(reference => reference.ContentType)
                .ThenBy(reference => reference.MediaId, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string Normalize(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }

        private static string? ExtractQueryValue(string query, string key)
        {
            foreach (var pair in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = pair.Split('=', 2);
                if (parts.Length == 2 && string.Equals(parts[0], key, StringComparison.OrdinalIgnoreCase))
                {
                    return Uri.UnescapeDataString(parts[1]);
                }
            }

            return null;
        }

        private static bool TryParseContentType(string value, out ContentType contentType)
        {
            if (int.TryParse(value, out var numericValue) &&
                Enum.IsDefined(typeof(ContentType), numericValue))
            {
                contentType = (ContentType)numericValue;
                return true;
            }

            return Enum.TryParse(value, ignoreCase: true, out contentType);
        }
    }

    public sealed record ContentMediaReference(string MediaId, ContentType ContentType);
}
