using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IProfileBlockBackgroundJobs
    {
        public Task DeleteFollowRequestAndUserFollow(string userId, string blockProfileId);
    }
}
