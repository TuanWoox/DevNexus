using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ContentMediaLinkService : IContentMediaLinkService
    {
        private readonly ApplicationDbContext _context;

        public ContentMediaLinkService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LinkPostMediaAsync(string userId, string postId, List<string>? ids)
        {
            if (ids == null || ids.Count == 0) return;

            var mediaToLink = await _context.PostMedias
                .Where(m => ids.Contains(m.Id) && m.PostId == null)
                .ToListAsync();

            foreach (var media in mediaToLink)
            {
                if (!string.IsNullOrEmpty(media.StoreDestination) && HelperUtils.BelongsToUser(media.StoreDestination, userId))
                {
                    media.PostId = postId;
                }
            }

            if (mediaToLink.Any(m => m.PostId == postId))
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task LinkQAMediaAsync(string userId, string qaPostId, List<string>? ids)
        {
            if (ids == null || ids.Count == 0) return;

            var mediaToLink = await _context.QAMedias
                .Where(m => ids.Contains(m.Id) && m.QAPostId == null)
                .ToListAsync();

            foreach (var media in mediaToLink)
            {
                if (!string.IsNullOrEmpty(media.StoreDestination) && HelperUtils.BelongsToUser(media.StoreDestination, userId))
                {
                    media.QAPostId = qaPostId;
                }
            }

            if (mediaToLink.Any(m => m.QAPostId == qaPostId))
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task LinkAnswerMediaAsync(string userId, string answerId, List<string>? ids)
        {
            if (ids == null || ids.Count == 0) return;

            var mediaToLink = await _context.AnswerMedias
                .Where(m => ids.Contains(m.Id) && m.AnswerId == null)
                .ToListAsync();

            foreach (var media in mediaToLink)
            {
                if (!string.IsNullOrEmpty(media.StoreDestination) && HelperUtils.BelongsToUser(media.StoreDestination, userId))
                {
                    media.AnswerId = answerId;
                }
            }

            if (mediaToLink.Any(m => m.AnswerId == answerId))
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task LinkCommentMediaAsync(string userId, string commentId, List<string>? ids)
        {
            if (ids == null || ids.Count == 0) return;

            var mediaToLink = await _context.CommentMedias
                .Where(m => ids.Contains(m.Id) && m.CommentId == null)
                .ToListAsync();

            foreach (var media in mediaToLink)
            {
                if (!string.IsNullOrEmpty(media.StoreDestination) && HelperUtils.BelongsToUser(media.StoreDestination, userId))
                {
                    media.CommentId = commentId;
                }
            }

            if (mediaToLink.Any(m => m.CommentId == commentId))
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}
