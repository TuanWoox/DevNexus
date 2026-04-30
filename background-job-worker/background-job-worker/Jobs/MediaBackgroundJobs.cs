using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace background_job_worker.Jobs
{
    public class MediaBackgroundJobs(ApplicationDbContext dbContext, IConfigurationService configurationService) : IMediaBackgroundJobs
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IConfigurationService _configurationService = configurationService;

        public async Task CleanUpOrphanFiles()
        {
            try
            {
                var cutoffDay = DateTimeOffset.UtcNow.AddDays(-7);

                var postMedias = await _dbContext.PostMedias
                    .Where(x => x.PostId != null && x.DateCreated <= cutoffDay)
                    .Select(x => x.StoreDestination)
                    .ToListAsync();

                var qaMedias = await _dbContext.QAMedias
                    .Where(x => x.QAPostId != null && x.DateCreated <= cutoffDay)
                    .Select(x => x.StoreDestination)
                    .ToListAsync();

                var allMedias = postMedias.Concat(qaMedias).Where(x => !string.IsNullOrEmpty(x));

                if (allMedias.Any())
                {
                    await Task.WhenAll(allMedias.Select(path => Task.Run(() =>
                    {
                        if (File.Exists(path)) File.Delete(path);
                    })));
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
        }
        public async Task CleanUpAbandonedTempFolders()
        {
            try
            {
                // Fetch the root upload folder path from configuration
                var rootUploadFolder = (await _configurationService.GetOneByKeyAndGroup("UPLOAD_FOLDER", "UPLOAD")).Result.Value;

                // Fallback to default path if configuration is missing
                if (string.IsNullOrEmpty(rootUploadFolder))
                    rootUploadFolder = HelperUtils.IsWindow ? @"D:\Uploads" : "/var/www/uploads";

                // Build paths for each media type root folder
                string qaMediaRoot = Path.Combine(rootUploadFolder, "qa-media");
                string postMediaRoot = Path.Combine(rootUploadFolder, "post-media");

                // Only process folders older than 24 hours (considered abandoned)
                var cutoff = DateTimeOffset.UtcNow.AddHours(-24);

                // Filter out roots that don't exist on disk yet
                var roots = new[] { qaMediaRoot, postMediaRoot }.Where(Directory.Exists);

                // Find all "temp" folders across both qa-media and post-media
                // Structure: {root}/{userId}/temp/{sessionId}
                var tempFolders = roots.SelectMany(root => Directory.GetDirectories(root, "temp", SearchOption.AllDirectories));

                // Process each temp folder in parallel
                await Task.WhenAll(tempFolders.Select(tempRoot => Task.Run(() =>
                {
                    // Each sessionFolder represents one incomplete/abandoned upload session
                    foreach (var sessionFolder in Directory.GetDirectories(tempRoot))
                    {
                        var createdAt = new DateTimeOffset(Directory.GetCreationTimeUtc(sessionFolder), TimeSpan.Zero);

                        // Delete session folder if it has been abandoned for more than 24 hours
                        if (createdAt <= cutoff)
                        {
                            Directory.Delete(sessionFolder, true);
                            DevNexusLogger.Instance.Info($"Deleted abandoned temp folder: {sessionFolder}");
                        }
                    }
                })));
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
        }
        public async Task UpdatePostMediaPostId(string userId, string postId, List<string> ids)
        {
            try
            {
                var mediaToLink = await _dbContext.PostMedias.Where(m => ids.Contains(m.Id)
                                                            && m.PostId == null)
                                                            .ToListAsync();
                foreach (var media in mediaToLink)
                {
                    if (HelperUtils.BelongsToUser(media.StoreDestination, userId))
                        media.PostId = postId;
                }
                if (mediaToLink.Any(m => m.PostId == postId)) await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
            }
        }
        public async Task UpdateQAPostMediaQAPostId(string userId, string qaPostId, List<string> ids)
        {
            try
            {
                var mediaToLink = await _dbContext.QAMedias.Where(m => ids.Contains(m.Id)
                                                            && m.QAPostId == null)
                                                            .ToListAsync();
                foreach (var media in mediaToLink)
                {
                    if (HelperUtils.BelongsToUser(media.StoreDestination, userId))
                        media.QAPostId = qaPostId;
                }
                if (mediaToLink.Any(m => m.QAPostId == qaPostId)) await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
            }
        }
    }
}
