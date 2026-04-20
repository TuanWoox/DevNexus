using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IMediaBackgroundJobs
    {
        public Task CleanUpOrphanFiles();
        public Task CleanUpAbandonedTempFolders();
        public Task UpdatePostMediaPostId(string userId, string postId, List<string> ids);
        public Task UpdateQAPostMediaQAPostId(string userId, string qaPostId, List<string> ids);
    }
}
