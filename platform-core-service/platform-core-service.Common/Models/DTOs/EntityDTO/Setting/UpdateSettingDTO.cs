using AutoMapper;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Setting
{
    public class UpdateSettingDTO : IBaseKey<string>
    {
        [TrimmedRequired]
        public string Id { get; set; }
        [TrimmedRequired]
        public string Key { get; set; }
        [TrimmedRequired]
        public string Group { get; set; }
        [TrimmedRequired]
        public string Value { get; set; }
        public SettingDataType DataType { get; set; } = SettingDataType.String;
        public bool IsSensitive { get; set; }
        public string? Description { get; set; }
    }
}
