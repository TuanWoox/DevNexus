using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.Helper
{
    public interface ISocialGuardService
    {
        Task<ReturnResult<bool>> CheckAddingPost(CreatePostDTO createPostDTO);
    }
}
