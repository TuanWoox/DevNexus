using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.PagingDTO
{
    public class FilterMapping : ICloneable
    {
        public string Prop { get; set; }
        public object Value { get; set; }
        public object FilterOperator { get; set; }
        public FilterType FilterType { get; set; } = FilterType.Text;

        public object Clone()
        {
            return MemberwiseClone();
        }
    }
}