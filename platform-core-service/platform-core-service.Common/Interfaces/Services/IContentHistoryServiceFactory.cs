namespace platform_core_service.Common.Interfaces.Services
{
    public interface IContentHistoryServiceFactory
    {
        IPostHistoryService GetPostHistoryService();
        IQAPostHistoryService GetQAPostHistoryService();
        ICommentHistoryService GetCommentHistoryService();
        IAnswerHistoryService GetAnswerHistoryService();
    }
}
