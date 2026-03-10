using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Model.Paging
{
    public class AdvanceFilterModel
    {
        public string PropertyName { get; set; }
        public Type Type { get; set; }
        public string MethodName { get; set; }
        public Type[]? TypeArguments { get; set; }
        public Expression[]? Expressions { get; set; }
        public Expression Expression { get; set; }
    }
}
