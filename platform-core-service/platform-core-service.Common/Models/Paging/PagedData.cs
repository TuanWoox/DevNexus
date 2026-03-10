using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Model.Paging
{
    public class PagedData<T, TKey>
    {
        public PagedData(Page<TKey> page)
        {
            this.Page = page;
        }

        public IEnumerable<T> Data { get; set; }
        public Page<TKey> Page { get; set; }
    }
    public class PagedData<T>
    {
        public PagedData(Page<string> page)
        {
            this.Page = page;
        }
        public IEnumerable<T> Data { get; set; }
        public Page<string> Page { get; set; }
    }
}
