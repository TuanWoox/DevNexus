using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;


namespace platform_core_service.Common.Interfaces.Services
{
    public interface IPostService
    {
        Task<ReturnResult<SelectPostDTO>> CreateAsync(CreatePostDTO createDTO);
        Task<ReturnResult<SelectPostDTO>> CreateShareAsync(CreatePostShareDTO createDTO);
        Task<ReturnResult<SelectPostDTO>> GetByIdAsync(string postId);
        Task<ReturnResult<SelectPostDTO>> GetByIdAndCommunityId(string postId, string communityId);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsync(Page<string> page);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsyncByProfileId(Page<string> page, string profileId);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsyncByCommunityId(Page<string> page, string communityId);
        Task<ReturnResult<PagedData<SelectPostDTO,string>>> GetPostAndQAByProfileId(Page<string> page, string profileId);
        Task<ReturnResult<SelectPostDTO>> ApproveCommunityPostAsync(string postId);
        Task<ReturnResult<SelectPostDTO>> RejectCommunityPostAsync(string postId, string? reason);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPendingPostsByCommunityIdAsync(Page<string> page, string communityId);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetMyPendingPostsByCommunityIdAsync(Page<string> page, string communityId);
        Task<ReturnResult<SelectPostDTO>> UpdateAsync(UpdatePostDTO updateDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string postId);
        Task<ReturnResult<int>> DeleteByIdsAsync(List<string> postIds);
    }
}
