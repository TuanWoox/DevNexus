using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Helper
{
    public class SocialGuardService 
    (
        ApplicationDbContext applicationDbContext,
        IUserContext userContext
    ): ISocialGuardService
    {
        private readonly ApplicationDbContext _dbContext = applicationDbContext;
        private readonly IUserContext _userContext = userContext;

        public async Task<ReturnResult<bool>> CheckAddingPost(CreatePostDTO createPostDTO)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                // Step 1: Validate input
                if (createPostDTO == null)
                {
                    returnResult.Message = "Post data is required";
                    return returnResult;
                }

                if (!string.IsNullOrEmpty(createPostDTO.CommunityId))
                {
                    var community = await _dbContext.Communities
                                                    .Where(x => x.Id == createPostDTO.CommunityId)
                                                    .Include(x => x.Members.Where(m => m.ProfileId == _userContext.ProfileId))
                                                    .FirstOrDefaultAsync();

                    if (community == null)
                    {
                        returnResult.Message = "Community not found";
                        return returnResult;
                    }

                    if (!community.Members.Any())
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                        return returnResult;
                    }
                }
                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }
            return returnResult;
        }
    }
}
