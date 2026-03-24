using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace background_job_worker.Jobs
{
    public class ProfileBackgroundJobs(ApplicationDbContext dbContext) : IProfileBlockBackgroundJobs
    {
        private readonly ApplicationDbContext _dbContext = dbContext;

        public async Task DeleteFollowRequestAndUserFollow(string profileId, string blockProfileId)
        {
            try
            {
                var existingFollowRequests = await _dbContext.FollowRequests
                    .Where(x => (x.RequesterProfileId == blockProfileId || x.RequesterProfileId == profileId)
                             && (x.TargetProfileId == profileId || x.TargetProfileId == blockProfileId))
                    .ToListAsync();

                var existingUserFollows = await _dbContext.UserFollows
                    .Where(x => (x.FollowingProfileId == blockProfileId || x.FollowingProfileId == profileId)
                             && (x.OwnerId == profileId || x.OwnerId == blockProfileId))
                    .ToListAsync();

                _dbContext.UserFollows.RemoveRange(existingUserFollows);
                _dbContext.FollowRequests.RemoveRange(existingFollowRequests);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
