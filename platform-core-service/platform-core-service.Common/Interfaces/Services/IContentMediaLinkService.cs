namespace platform_core_service.Common.Interfaces.Services
{
    public interface IContentMediaLinkService
    {
        Task LinkPostMediaAsync(string userId, string postId, List<string>? ids);
        Task LinkQAMediaAsync(string userId, string qaPostId, List<string>? ids);
        Task LinkAnswerMediaAsync(string userId, string answerId, List<string>? ids);
        Task LinkCommentMediaAsync(string userId, string commentId, List<string>? ids);
    }
}
