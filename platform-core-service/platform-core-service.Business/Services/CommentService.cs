using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using CommentEntity = platform_core_service.Common.Entities.DbEntities.Comment;

namespace platform_core_service.Business.Services
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IRepository<CommentEntity, string> _commentRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public CommentService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserContext userContext,
            IRepository<CommentEntity, string> commentRepository,
            IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _commentRepository = commentRepository;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ReturnResult<SelectCommentDTO>> CreateAsync(CreateCommentDTO createDTO)
        {
            var result = new ReturnResult<SelectCommentDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Comment data is required";
                    return result;
                }

                // Step 2: Validate at least one parent is provided

                var hasPost = !string.IsNullOrEmpty(createDTO.PostId);
                var hasAnswer = !string.IsNullOrEmpty(createDTO.AnswerId);
                var hasReply = !string.IsNullOrEmpty(createDTO.ReplyToCommentId);

                if (hasPost && hasAnswer)
                {
                    result.Message = "Comment cannot be associated with both a Post and an Answer";
                    return result;
                }
                // If this is not a reply, it must be associated with exactly one parent (Post or Answer)
                if (!hasReply && !hasPost && !hasAnswer)
                {
                    result.Message = "Comment must be associated with a Post or Answer, or reply to another comment";
                    return result;
                }

                // Step 3: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 4: Validate parent references and handle reply logic
                if (!string.IsNullOrEmpty(createDTO.ReplyToCommentId))
                {
                    var parentComment = await _context.Comments
                        .FirstOrDefaultAsync(c => c.Id == createDTO.ReplyToCommentId && !c.Deleted);

                    if (parentComment == null)
                    {
                        result.Message = "Reply-to comment not found";
                        return result;
                    }

                    // One-level threading: Check that parent comment is not itself a reply
                    if (!string.IsNullOrEmpty(parentComment.ReplyToCommentId))
                    {
                        result.Message = "Cannot reply to a reply comment (one-level threading only)";
                        return result;
                    }

                    // Stricter one-level threading: cannot reply to comments on answers
                    if (!string.IsNullOrEmpty(parentComment.AnswerId))
                    {
                        result.Message = "Cannot reply to comments on answers (one-level threading only)";
                        return result;
                    }

                    // Inherit PostId/AnswerId from parent comment
                    createDTO.PostId = parentComment.PostId;
                    createDTO.AnswerId = parentComment.AnswerId;
                }

                // Step 5: Map DTO to entity
                var comment = _mapper.Map<CommentEntity>(createDTO);
                comment.AuthorId = profileId;
                comment.Id = Guid.NewGuid().ToString();

                // Step 6: Save comment
                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                if (createDTO.MediaIds.Count > 0)
                {
                    _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x =>
                        x.UpdateCommentMediaCommentId(_userContext.UserId, comment.Id, createDTO.MediaIds));
                }

                // Step 7: Return mapped DTO with includes
                var savedComment = await _context.Comments
                    .Include(c => c.Author)
                    .Include(c => c.Post)
                    .Include(c => c.Answer)
                        .ThenInclude(a => a.QAPost)
                    .Include(c => c.ReplyToComment)
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == comment.Id);

                if (savedComment != null)
                {
                    await PublishCommentNotificationsAsync(comment.Id, profileId, savedComment);
                }

                result.Result = _mapper.Map<SelectCommentDTO>(savedComment);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while creating comment: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommentDTO>> GetByIdAsync(string commentId)
        {
            var result = new ReturnResult<SelectCommentDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(commentId))
                {
                    result.Message = "Comment ID is required";
                    return result;
                }

                // Step 2: Load comment with author and replies (public read - no ownership check)
                var comment = await _context.Comments
                    .Include(c => c.Replies)
                        .ThenInclude(r => r.Author)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                {
                    result.Message = $"Comment {commentId} not found";
                    return result;
                }

                result.Result = _mapper.Map<SelectCommentDTO>(comment);
                await SetCurrentUserVoteAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving comment: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetMyCommentsAsync(CommentFilterDTO filter, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                // Step 1: Get current user profile
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 2: Build query for current user's comments
                var query = _context.Comments
                    .Where(c => c.AuthorId == profileId)
                    .Include(c => c.Author)
                    .AsQueryable();

                // Step 3: Apply filters
                if (filter != null)
                {
                    if (!string.IsNullOrEmpty(filter.PostId))
                    {
                        query = query.Where(c => c.PostId == filter.PostId);
                    }

                    if (!string.IsNullOrEmpty(filter.AnswerId))
                    {
                        query = query.Where(c => c.AnswerId == filter.AnswerId);
                    }

                    if (filter.RepliesOnly)
                    {
                        query = query.Where(c => !string.IsNullOrEmpty(c.ReplyToCommentId));
                    }
                }

                // Step 4: Get paged results
                result.Result = await _commentRepository.GetPagingAsync<Page<string>, SelectCommentDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving your comments: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetRepliesAsync(string commentId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(commentId))
                {
                    result.Message = "Comment ID is required";
                    return result;
                }

                // Step 2: Verify parent comment exists
                var parentComment = await _context.Comments
                    .FirstOrDefaultAsync(c => c.Id == commentId && !c.Deleted);

                if (parentComment == null)
                {
                    result.Message = $"Comment {commentId} not found";
                    return result;
                }

                // Step 3: Build query for direct replies to this comment (public read)
                var query = _context.Comments
                    .Where(c => c.ReplyToCommentId == commentId)
                    .Include(c => c.Author)
                    .AsQueryable();

                // Step 4: Get paged results
                result.Result = await _commentRepository.GetPagingAsync<Page<string>, SelectCommentDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving replies: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommentDTO>> UpdateAsync(UpdateCommentDTO updateDTO)
        {
            var result = new ReturnResult<SelectCommentDTO>();
            try
            {
                // Step 1: Validate inputs
                if (updateDTO == null || string.IsNullOrEmpty(updateDTO.Id))
                {
                    result.Message = "Update data with valid ID is required";
                    return result;
                }

                var commentId = updateDTO.Id;

                // Step 2: Load comment
                var comment = await _context.Comments
                    .Include(c => c.Author)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                {
                    result.Message = $"Comment {commentId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (comment.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to update this comment";
                    return result;
                }

                // Step 4: Update comment (only Content can be updated)
                _mapper.Map(updateDTO, comment);

                // Step 5: Save changes
                _context.Comments.Update(comment);
                await _context.SaveChangesAsync();

                if (updateDTO.MediaIds?.Count > 0)
                {
                    _backgroundJobClient.Enqueue<IMediaBackgroundJobs>(x =>
                        x.UpdateCommentMediaCommentId(_userContext.UserId, commentId, updateDTO.MediaIds));
                }

                // Step 6: Reload and return
                var updatedComment = await _context.Comments
                    .Include(c => c.Author)
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                result.Result = _mapper.Map<SelectCommentDTO>(updatedComment);
                await SetCurrentUserVoteAsync(result.Result);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating comment: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> DeleteByIdAsync(string commentId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(commentId))
                {
                    result.Message = "Comment ID is required";
                    return result;
                }

                // Step 2: Load comment with replies
                var comment = await _context.Comments
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                {
                    result.Message = $"Comment {commentId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (comment.AuthorId != profileId)
                {
                    result.Message = "You do not have permission to delete this comment";
                    return result;
                }
                comment.Deleted = true;
                if (comment.Replies != null && comment.Replies.Any())
                {
                    foreach (var reply in comment.Replies)
                    {
                        reply.Deleted = true;
                    }
                }
                // Step 4: Delete comment (cascades to replies via soft delete)
                _context.Comments.Update(comment);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting comment: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetCommentsByPostAsync(string postId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(postId))
                {
                    result.Message = "Post ID is required";
                    return result;
                }

                // Step 2: Build query for top-level comments on this post (public read)
                // Only get comments that are NOT replies (ReplyToCommentId IS NULL)
                var query = _context.Comments
                    .Where(c => c.PostId == postId && string.IsNullOrEmpty(c.ReplyToCommentId))
                    .Include(c => c.Author)
                    .Include(c => c.Replies)
                        .ThenInclude(r => r.Author)
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _commentRepository.GetPagingAsync<Page<string>, SelectCommentDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving comments: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetCommentsByAnswerAsync(string answerId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommentDTO, string>>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(answerId))
                {
                    result.Message = "Answer ID is required";
                    return result;
                }

                // Step 2: Build query for top-level comments on this answer (public read)
                // Only get comments that are NOT replies (ReplyToCommentId IS NULL)
                var query = _context.Comments
                    .Where(c => c.AnswerId == answerId && string.IsNullOrEmpty(c.ReplyToCommentId))
                    .Include(c => c.Author)
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _commentRepository.GetPagingAsync<Page<string>, SelectCommentDTO>(query, page);
                if (result.Result?.Data != null && result.Result.Data.Any())
                {
                    await SetCurrentUserVotesForListAsync(result.Result.Data.ToList());
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving comments: {ex.Message}";
            }
            return result;
        }
        private async Task SetCurrentUserVotesForListAsync(List<SelectCommentDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return;
            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;
            var commentIds = dtos.Select(s => s.Id).ToList();

            var votes = await _context.Votes
                .Where(v => v.AuthorId == profileId && commentIds.Contains(v.CommentId))
                .Select(v => new { v.CommentId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes.ToDictionary(v => v.CommentId, v => (bool?)v.IsUpvote);

            foreach (var dto in dtos)
            {
                dto.CurrentUserVote = voteMap.TryGetValue(dto.Id, out var vote) ? vote : null;
            }
        }
        private async Task SetCurrentUserVoteAsync(SelectCommentDTO dto)
        {
            if (dto == null) return;

            string profileId = _userContext.ProfileId;
            if (string.IsNullOrEmpty(profileId)) return;

            var vote = await _context.Votes
                .Where(v => v.AuthorId == profileId && v.CommentId == dto.Id)
                .Select(v => (bool?)v.IsUpvote)
                .FirstOrDefaultAsync();

            dto.CurrentUserVote = vote;
        }

        private static string? GetPreview(string? content)
        {
            if (string.IsNullOrEmpty(content))
            {
                return content;
            }

            return content.Substring(0, Math.Min(200, content.Length));
        }

        private void EnqueueNotification(NotiicationCreatedEntityDTO notificationEvent, string routingKey)
        {
            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, routingKey));
        }

        private void PublishCommentNotification(
            NotificationEventType eventType,
            string recipientId,
            string actorId,
            string entityId,
            string? entityTitle,
            string? entityPreview,
            string actionUrl,
            NotificationEntityType entityType = NotificationEntityType.COMMENT
        )
        {
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = eventType,
                ActorId = actorId,
                RecipientId = recipientId,
                EntityType = entityType,
                EntityId = entityId,
                EntityTitle = entityTitle,
                EntityPreview = entityPreview,
                ActionUrl = actionUrl
            };

            EnqueueNotification(notificationEvent, "notifications.comment");
        }

        private Task PublishCommentNotificationsAsync(string commentId, string actorId, CommentEntity savedComment)
        {
            // CASE 1: Reply to comment on Post/Question (one-level threading)
            if (!string.IsNullOrEmpty(savedComment.ReplyToCommentId))
            {
                var rootPost = savedComment.Post;
                var isQuestion = rootPost is QAPost;
                var actionUrl = isQuestion
                    ? $"/questions/{rootPost?.Id}#comment-{commentId}"
                    : $"/post/{rootPost?.Id}#comment-{commentId}";

                // 1) Notify parent comment author
                var parentCommentAuthorId = savedComment.ReplyToComment?.AuthorId;
                if (!string.IsNullOrEmpty(parentCommentAuthorId) && parentCommentAuthorId != actorId)
                {
                    PublishCommentNotification(
                        eventType: NotificationEventType.REPLY_COMMENT,
                        recipientId: parentCommentAuthorId,
                        actorId: actorId,
                        entityId: commentId,
                        entityTitle: rootPost?.Title,
                        entityPreview: GetPreview(savedComment.Content),
                        actionUrl: actionUrl);
                }

                // 2) Notify post/question author (if different from actor and from parent comment author)
                var postAuthorId = rootPost?.AuthorId;
                if (!string.IsNullOrEmpty(postAuthorId)
                    && postAuthorId != actorId
                    && postAuthorId != parentCommentAuthorId)
                {
                    PublishCommentNotification(
                        eventType: isQuestion ? NotificationEventType.COMMENT_QUESTION : NotificationEventType.COMMENT_POST,
                        recipientId: postAuthorId,
                        actorId: actorId,
                        entityId: commentId,
                        entityTitle: rootPost?.Title,
                        entityPreview: GetPreview(savedComment.Content),
                        actionUrl: actionUrl);
                }

                return Task.CompletedTask;
            }

            // CASE 2: Comment on an answer
            if (!string.IsNullOrEmpty(savedComment.AnswerId))
            {
                var recipientId = savedComment.Answer?.AuthorId;
                var rootPost = savedComment.Answer?.QAPost;

                if (!string.IsNullOrEmpty(recipientId) && recipientId != actorId && rootPost != null)
                {
                    PublishCommentNotification(
                        eventType: NotificationEventType.COMMENT_ANSWER,
                        recipientId: recipientId,
                        actorId: actorId,
                        entityId: commentId,
                        entityTitle: rootPost.Title,
                        entityPreview: GetPreview(savedComment.Content),
                        actionUrl: $"/questions/{rootPost.Id}#comment-{commentId}");
                }

                return Task.CompletedTask;
            }

            // CASE 3: Comment on a post (or question)
            {
                var rootPost = savedComment.Post;
                var recipientId = rootPost?.AuthorId;
                var isQuestion = rootPost is QAPost;
                var actionUrl = isQuestion
                    ? $"/questions/{rootPost?.Id}#comment-{commentId}"
                    : $"/post/{rootPost?.Id}#comment-{commentId}";

                if (!string.IsNullOrEmpty(recipientId) && recipientId != actorId && rootPost != null)
                {
                    PublishCommentNotification(
                        eventType: isQuestion ? NotificationEventType.COMMENT_QUESTION : NotificationEventType.COMMENT_POST,
                        recipientId: recipientId,
                        actorId: actorId,
                        entityId: rootPost.Id,
                        entityTitle: rootPost.Title,
                        entityPreview: GetPreview(savedComment.Content),
                        actionUrl: actionUrl,
                        entityType: NotificationEntityType.POST
                    );
                }

                return Task.CompletedTask;
            }
        }
    }
}
