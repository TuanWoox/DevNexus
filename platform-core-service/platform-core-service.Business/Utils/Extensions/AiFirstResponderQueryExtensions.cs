using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class AiFirstResponderQueryExtensions
    {
        public static Task<bool> HasExistingAiFirstResponderAnswerAsync(
            this IQueryable<Answer> answers,
            string postId)
        {
            return answers
                .IgnoreQueryFilters()
                .AnyAsync(answer =>
                    answer.QAPostId == postId &&
                    !answer.Deleted &&
                    answer.Author.IsSystemProfile);
        }
    }
}
