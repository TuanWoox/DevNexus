using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Common.Interfaces.Factories
{
    public interface IContentHistoryServiceFactory
    {
        IPostHistoryService GetPostHistoryService();
        IQAPostHistoryService GetQAPostHistoryService();
        ICommentHistoryService GetCommentHistoryService();
        IAnswerHistoryService GetAnswerHistoryService();
    }
}
