using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Data;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class AiFirstResponderQueryExtensions
    {
        public static Task<bool> HasExistingAiFirstResponderAnswerAsync(
            this IQueryable<Answer> answers,
            ApplicationDbContext context,
            string postId)
        {
            return answers
                .IgnoreQueryFilters()
                .AnyAsync(answer =>
                    answer.QAPostId == postId &&
                    !answer.Deleted &&
                    context.Profiles.Any(profile =>
                        profile.Id == answer.AuthorId &&
                        (profile.ApplicationUser.UserName == "admin" ||
                         profile.ApplicationUser.UserRoles.Any(userRole => userRole.Role.Name == "Admin"))));
        }
    }
}
