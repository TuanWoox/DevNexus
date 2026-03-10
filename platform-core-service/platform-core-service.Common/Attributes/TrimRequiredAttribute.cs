using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Attributes
{
    public class TrimmedRequiredAttribute : ValidationAttribute
    {
        public TrimmedRequiredAttribute()
        {
            ErrorMessage = "The field is required.";
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value is string str)
            {
                if (string.IsNullOrWhiteSpace(str?.Trim()))
                {
                    return new ValidationResult(ErrorMessage);
                }
            }
            else if (value == null)
            {
                return new ValidationResult(ErrorMessage);
            }

            return ValidationResult.Success;
        }
    }
}