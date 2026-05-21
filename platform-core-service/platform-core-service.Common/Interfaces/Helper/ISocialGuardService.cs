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

        Task<ReturnResult<bool>> CheckVisibleContent(string authorId, string? communityId = null);
        Task<ReturnResult<bool>> CheckBelongToCommunity(string communityId);
        Task<ReturnResult<bool>> CheckIsMutedInCommunityAsync(string profileId, string communityId);
        Task<ReturnResult<bool>> CheckIsCommunityAdminOrModeratorAsync(string profileId, string communityId);
        Task<ReturnResult<bool>> CheckProfileBlocking(string authorId);
        Task<ReturnResult<bool>> CheckFollowProfile(string authorId);

        Task<bool> IsBlockedRelation(string viewerProfileId, string targetProfileId);
        Task<ReturnResult<bool>> CanAccessProfileBasicInfo(string targetProfileId);
        Task<ReturnResult<bool>> CanViewProfilePersonalContent(string targetProfileId);
        Task<ReturnResult<bool>> CanFollowProfile(string targetProfileId);
        Task<ReturnResult<bool>> CanViewPost(string postId);
        Task<ReturnResult<bool>> CanViewQAPost(string qaPostId);
        Task<ReturnResult<bool>> CanViewComment(string commentId);
        Task<ReturnResult<bool>> CanViewAnswer(string answerId);
        Task<ReturnResult<bool>> CanCommentOnPost(string postId);
        Task<ReturnResult<bool>> CanCommentOnAnswer(string answerId);
        Task<ReturnResult<bool>> CanReplyComment(string commentId);
        Task<ReturnResult<bool>> CanAnswerQuestion(string qaPostId);
        Task<ReturnResult<bool>> CanVotePost(string postId);
        Task<ReturnResult<bool>> CanVoteAnswer(string answerId);
        Task<ReturnResult<bool>> CanVoteComment(string commentId);
        Task<ReturnResult<bool>> CanSavePost(string postId);
        Task<ReturnResult<bool>> CanSaveQuestion(string qaPostId);
        Task<ReturnResult<bool>> CanRemoveBookmark(string bookmarkItemId);
    }
}
