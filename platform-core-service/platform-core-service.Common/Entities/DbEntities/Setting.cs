using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Setting : BaseEntity<string>
    {
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
        public string Group { get; set; } = null!;
        public SettingDataType DataType { get; set; } = SettingDataType.String;
        public bool IsSensitive { get; set; } = false;
        public string? Description { get; set; }
        public string? UpdatedBy { get; set; }
    }
}