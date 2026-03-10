using Microsoft.AspNetCore.Http;
using System.Globalization;
using System.Reflection;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace platform_core_service.Common.Utils.Extensions
{
    public static class DevNexusExtension
    {
        public static IEnumerable<T> IfThenElse<T>(
        this IEnumerable<T> elements,
        Func<bool> condition,
        Func<IEnumerable<T>, IEnumerable<T>> thenPath,
        Func<IEnumerable<T>, IEnumerable<T>> elsePath)
        {
            return condition()
                ? thenPath(elements)
                : elsePath(elements);
        }
        public static string UpperFirstChar(this string data)
        {
            string result = data;
            if (!string.IsNullOrEmpty(data))
            {
                result = data.First().ToString().ToUpper() + data.Substring(1);
            }
            return result;
        }
        public static string UppercaseFirstLetters(this string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return input;

            TextInfo textInfo = CultureInfo.CurrentCulture.TextInfo;
            return textInfo.ToTitleCase(input.ToLower());
        }
        public static string ToKebabCase(this string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return input;
            // Step 1: Insert dash before capital letters (for PascalCase / camelCase)
            string result = Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1-$2");
            // Step 2: Replace spaces and underscores with dash
            result = Regex.Replace(result, @"[\s_]+", "-");
            // Step 3: Convert to lowercase
            return result.ToLowerInvariant();
        }
        public static string GetUserId(this ClaimsPrincipal principal)
        {
            if (principal == null)
                throw new ArgumentNullException(nameof(principal));

            return principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        public static DateRangeFilter GetDateTimeByQuarter(int quarter)
        {
            DateRangeFilter filters = new DateRangeFilter();
            var currentYears = DateTime.Now.Year;
            switch (quarter)
            {
                case 1:
                    filters.StartDate = new DateTime(currentYears, 1, 1);
                    filters.EndDate = new DateTime(currentYears, 3, 31, 23, 59, 59);
                    break;
                case 2:
                    filters.StartDate = new DateTime(currentYears, 4, 1);
                    filters.EndDate = new DateTime(currentYears, 6, 30, 23, 59, 59);
                    break;
                case 3:
                    filters.StartDate = new DateTime(currentYears, 7, 1);
                    filters.EndDate = new DateTime(currentYears, 9, 30, 23, 59, 59);
                    break;
                case 4:
                    filters.StartDate = new DateTime(currentYears, 10, 1);
                    filters.EndDate = new DateTime(currentYears, 12, 31, 23, 59, 59);
                    break;
            }
            return filters;
        }
        public static TMain UpdateProperties<TMain, TUpdate>(TMain mainObject, TUpdate updatingObject)
        where TMain : class
        where TUpdate : class
        {
            // Get the types of both objects
            Type mainType = typeof(TMain);
            Type updateType = typeof(TUpdate);

            // Get the properties of the main and updating objects
            PropertyInfo[] mainProperties = mainType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            PropertyInfo[] updateProperties = updateType.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            // Create a dictionary for fast lookup of updating properties
            var updatePropertiesDict = new Dictionary<string, PropertyInfo>();
            foreach (var prop in updateProperties)
            {
                updatePropertiesDict[prop.Name] = prop;
            }

            foreach (var prop in mainProperties)
            {
                if (updatePropertiesDict.TryGetValue(prop.Name, out var updateProp))
                {
                    // Get the value from the updating object
                    var newValue = updateProp.GetValue(updatingObject);

                    // Only update the main object if the new value is not null
                    if (newValue != null)
                    {
                        prop.SetValue(mainObject, newValue);
                    }
                }
            }
            return mainObject;
        }
        public static bool HasValidImageExtension(this IFormFile file)
        {
            string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            if (file == null || string.IsNullOrWhiteSpace(file.FileName) || file.Length == 0)
                return false;
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }
    }
    public class DateRangeFilter
    {
        public DateTimeOffset? StartDate { get; set; }
        public DateTimeOffset? EndDate { get; set; }
    }
}