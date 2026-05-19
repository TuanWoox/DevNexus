using platform_core_service.Common.Interfaces.Factories;
using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Business.Factories
{
    public class ContentMediaServiceFactory : IContentMediaServiceFactory
    {
        private readonly IPostMediaService _postMediaService;
        private readonly IQAMediaService _qaMediaService;
        private readonly IAnswerMediaService _answerMediaService;
        private readonly ICommentMediaService _commentMediaService;

        public ContentMediaServiceFactory(
            IPostMediaService postMediaService,
            IQAMediaService qaMediaService,
            IAnswerMediaService answerMediaService,
            ICommentMediaService commentMediaService)
        {
            _postMediaService = postMediaService;
            _qaMediaService = qaMediaService;
            _answerMediaService = answerMediaService;
            _commentMediaService = commentMediaService;
        }

        public IPostMediaService GetPostMediaService()
        {
            return _postMediaService;
        }

        public IQAMediaService GetQAMediaService()
        {
            return _qaMediaService;
        }

        public IAnswerMediaService GetAnswerMediaService()
        {
            return _answerMediaService;
        }

        public ICommentMediaService GetCommentMediaService()
        {
            return _commentMediaService;
        }
    }
}
