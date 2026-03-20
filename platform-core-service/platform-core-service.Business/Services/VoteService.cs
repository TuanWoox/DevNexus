using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Vote;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class VoteService : IVoteService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IUserContext _userContext;

        public VoteService(ApplicationDbContext dbContext, IUserContext userContext)
        {
            _dbContext = dbContext;
            _userContext = userContext;
        }

        public async Task<ReturnResult<bool>> VotePostAsync(string postId, VoteRequestDTO voteRequest)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(postId) || voteRequest == null)
                {
                    result.Message = "Post ID and vote data are required";
                    return result;
                }

                // Step 2: Check auth
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load post
                var post = await _dbContext.Posts.FirstOrDefaultAsync(p => p.Id == postId);
                if (post == null)
                {
                    result.Message = $"Post {postId} not found";
                    return result;
                }

                // Step 4: Toggle vote
                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.PostId == postId);

                if (existingVote == null)
                {
                    // Insert new vote
                    _dbContext.Votes.Add(new Vote
                    {
                        AuthorId = profileId,
                        PostId = postId,
                        IsUpvote = voteRequest.IsUpvote
                    });

                    if (voteRequest.IsUpvote) post.UpvoteCount++;
                    else post.DownvoteCount++;
                }
                else if (existingVote.IsUpvote == voteRequest.IsUpvote)
                {
                    // Same direction — toggle off (remove vote)
                    _dbContext.Votes.Remove(existingVote);

                    if (voteRequest.IsUpvote) post.UpvoteCount--;
                    else post.DownvoteCount--;
                }
                else
                {
                    // Different direction — switch vote
                    existingVote.IsUpvote = voteRequest.IsUpvote;

                    if (voteRequest.IsUpvote)
                    {
                        post.UpvoteCount++;
                        post.DownvoteCount--;
                    }
                    else
                    {
                        post.DownvoteCount++;
                        post.UpvoteCount--;
                    }
                }

                _dbContext.Posts.Update(post);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while voting on post: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<bool>> VoteAnswerAsync(string answerId, VoteRequestDTO voteRequest)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(answerId) || voteRequest == null)
                {
                    result.Message = "Answer ID and vote data are required";
                    return result;
                }

                // Step 2: Check auth
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load answer
                var answer = await _dbContext.Answers.FirstOrDefaultAsync(a => a.Id == answerId);
                if (answer == null)
                {
                    result.Message = $"Answer {answerId} not found";
                    return result;
                }

                // Step 4: Toggle vote
                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.AnswerId == answerId);

                if (existingVote == null)
                {
                    _dbContext.Votes.Add(new Vote
                    {
                        AuthorId = profileId,
                        AnswerId = answerId,
                        IsUpvote = voteRequest.IsUpvote
                    });

                    if (voteRequest.IsUpvote) answer.UpvoteCount++;
                    else answer.DownvoteCount++;
                }
                else if (existingVote.IsUpvote == voteRequest.IsUpvote)
                {
                    _dbContext.Votes.Remove(existingVote);

                    if (voteRequest.IsUpvote) answer.UpvoteCount--;
                    else answer.DownvoteCount--;
                }
                else
                {
                    existingVote.IsUpvote = voteRequest.IsUpvote;

                    if (voteRequest.IsUpvote)
                    {
                        answer.UpvoteCount++;
                        answer.DownvoteCount--;
                    }
                    else
                    {
                        answer.DownvoteCount++;
                        answer.UpvoteCount--;
                    }
                }

                _dbContext.Answers.Update(answer);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while voting on answer: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<bool>> VoteCommentAsync(string commentId, VoteRequestDTO voteRequest)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate
                if (string.IsNullOrEmpty(commentId) || voteRequest == null)
                {
                    result.Message = "Comment ID and vote data are required";
                    return result;
                }

                // Step 2: Check auth
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load comment
                var comment = await _dbContext.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
                if (comment == null)
                {
                    result.Message = $"Comment {commentId} not found";
                    return result;
                }

                // Step 4: Toggle vote
                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.CommentId == commentId);

                if (existingVote == null)
                {
                    _dbContext.Votes.Add(new Vote
                    {
                        AuthorId = profileId,
                        CommentId = commentId,
                        IsUpvote = voteRequest.IsUpvote
                    });

                    if (voteRequest.IsUpvote) comment.UpvoteCount++;
                    else comment.DownvoteCount++;
                }
                else if (existingVote.IsUpvote == voteRequest.IsUpvote)
                {
                    _dbContext.Votes.Remove(existingVote);

                    if (voteRequest.IsUpvote) comment.UpvoteCount--;
                    else comment.DownvoteCount--;
                }
                else
                {
                    existingVote.IsUpvote = voteRequest.IsUpvote;

                    if (voteRequest.IsUpvote)
                    {
                        comment.UpvoteCount++;
                        comment.DownvoteCount--;
                    }
                    else
                    {
                        comment.DownvoteCount++;
                        comment.UpvoteCount--;
                    }
                }

                _dbContext.Comments.Update(comment);
                await _dbContext.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while voting on comment: {ex.Message}";
                result.Result = false;
            }
            return result;
        }
    }
}
