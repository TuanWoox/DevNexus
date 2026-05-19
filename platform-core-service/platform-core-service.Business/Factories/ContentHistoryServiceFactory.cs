using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Business.Factories
{
    public class ContentHistoryServiceFactory : IContentHistoryServiceFactory
    {
        private readonly IPostHistoryService _postHistoryService;
        private readonly IQAPostHistoryService _qaPostHistoryService;
        private readonly ICommentHistoryService _commentHistoryService;
        private readonly IAnswerHistoryService _answerHistoryService;

        public ContentHistoryServiceFactory(
            IPostHistoryService postHistoryService,
            IQAPostHistoryService qaPostHistoryService,
            ICommentHistoryService commentHistoryService,
            IAnswerHistoryService answerHistoryService)
        {
            _postHistoryService = postHistoryService;
            _qaPostHistoryService = qaPostHistoryService;
            _commentHistoryService = commentHistoryService;
            _answerHistoryService = answerHistoryService;
        }

        public IPostHistoryService GetPostHistoryService() => _postHistoryService;
        public IQAPostHistoryService GetQAPostHistoryService() => _qaPostHistoryService;
        public ICommentHistoryService GetCommentHistoryService() => _commentHistoryService;
        public IAnswerHistoryService GetAnswerHistoryService() => _answerHistoryService;
    }
}
