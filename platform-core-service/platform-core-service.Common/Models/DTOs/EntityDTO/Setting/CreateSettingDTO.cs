using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Setting
{
    public class CreateSettingDTO
    {
        [TrimmedRequired]
        public string Key { get; set; }

        [TrimmedRequired]
        public string Group { get; set; }

        [TrimmedRequired]
        public string Value { get; set; }

        public SettingDataType DataType { get; set; } = SettingDataType.String;

        public bool IsSensitive { get; set; } = false;

        public string? Description { get; set; }
    }
}
