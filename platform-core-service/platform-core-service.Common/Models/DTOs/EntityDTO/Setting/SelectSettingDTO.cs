using AutoMapper;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Setting
{
    public class SelectSettingDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;

        [Required]
        public string Key { get; set; } = null!;

        [Required]
        public string Group { get; set; } = null!;

        [Required]
        public string Value { get; set; } = null!;
        [Required]
        public SettingDataType DataType { get; set; } = SettingDataType.String;
        public bool IsSensitive { get; set; }
        public string? Description { get; set; }
    }
}
