using platform_core_service.Common.Models.DTOs.HelperDTO;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IAIFirstResponderBackgroundJobs
    {
        /// <summary>
        /// Trigger AI to generate first response for approved post
        /// </summary>
        /// <param name="postId">Post ID</param>
        /// <returns>Success status</returns>
        Task<ReturnResult<bool>> GenerateFirstResponseAsync(string postId);
    }
}
