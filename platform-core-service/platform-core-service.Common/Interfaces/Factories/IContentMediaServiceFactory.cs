using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Common.Interfaces.Factories
{
    public interface IContentMediaServiceFactory
    {
        IPostMediaService GetPostMediaService();
        IQAMediaService GetQAMediaService();
        IAnswerMediaService GetAnswerMediaService();
        ICommentMediaService GetCommentMediaService();
    }
}
