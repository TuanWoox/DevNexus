namespace platform_core_service.Common.Helpers
{
    public static class HelperUtils
    {
        public static string GenerateSlug(string name)
        {
            if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString().Substring(0, 8);

            return name
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("--", "-");
        }
    }
}

