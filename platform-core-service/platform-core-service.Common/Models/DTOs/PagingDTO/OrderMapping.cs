using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.PagingDTO
{
    public class OrderMapping : ICloneable
    {
        public string Sort { get; set; }
        public SortOrderType SortDir { get; set; }
        public string DataType { get; set; }
        public object Clone()
        {
            return MemberwiseClone();
        }
    }
}