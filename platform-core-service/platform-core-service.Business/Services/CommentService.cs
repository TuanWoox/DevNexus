using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.HelperDTO;
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

        public CommentService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserContext userContext,
            IRepository<CommentEntity, string> commentRepository)
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _commentRepository = commentRepository;
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

                // Step 7: Return mapped DTO with includes
                var savedComment = await _context.Comments
                    .Include(c => c.Author)
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == comment.Id);

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

                // Step 6: Reload and return
                var updatedComment = await _context.Comments
                    .Include(c => c.Author)
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                result.Result = _mapper.Map<SelectCommentDTO>(updatedComment);
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
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _commentRepository.GetPagingAsync<Page<string>, SelectCommentDTO>(query, page);
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
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving comments: {ex.Message}";
            }
            return result;
        }
    }
}
