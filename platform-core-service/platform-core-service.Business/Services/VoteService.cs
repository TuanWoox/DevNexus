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
            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                if (string.IsNullOrEmpty(postId) || voteRequest == null)
                    return ReturnError(result, "Post ID and vote data are required");

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                    return ReturnError(result, "User profile not found");

                if (!await _dbContext.Posts.AnyAsync(p => p.Id == postId))
                    return ReturnError(result, $"Post {postId} not found");

                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.PostId == postId);

                var (upvoteChange, downvoteChange) = CalculateVoteDelta(existingVote, profileId, voteRequest.IsUpvote, postId: postId);

                await _dbContext.SaveChangesAsync();

                if (upvoteChange != 0 || downvoteChange != 0)
                {
                    await _dbContext.Posts
                        .Where(p => p.Id == postId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.UpvoteCount, p => p.UpvoteCount + upvoteChange)
                            .SetProperty(p => p.DownvoteCount, p => p.DownvoteCount + downvoteChange));
                }

                await transaction.CommitAsync();
                result.Result = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                DevNexusLogger.Instance.Debug(ex.Message);
                return ReturnError(result, $"An error occurred while voting on post: {ex.Message}");
            }

            return result;
        }

        public async Task<ReturnResult<bool>> VoteAnswerAsync(string answerId, VoteRequestDTO voteRequest)
        {
            var result = new ReturnResult<bool>();
            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                if (string.IsNullOrEmpty(answerId) || voteRequest == null)
                    return ReturnError(result, "Answer ID and vote data are required");

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                    return ReturnError(result, "User profile not found");

                if (!await _dbContext.Answers.AnyAsync(a => a.Id == answerId))
                    return ReturnError(result, $"Answer {answerId} not found");

                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.AnswerId == answerId);

                // Tái sử dụng hàm private
                var (upvoteChange, downvoteChange) = CalculateVoteDelta(existingVote, profileId, voteRequest.IsUpvote, answerId: answerId);

                await _dbContext.SaveChangesAsync();

                if (upvoteChange != 0 || downvoteChange != 0)
                {
                    await _dbContext.Answers
                        .Where(a => a.Id == answerId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(a => a.UpvoteCount, a => a.UpvoteCount + upvoteChange)
                            .SetProperty(a => a.DownvoteCount, a => a.DownvoteCount + downvoteChange));
                }

                await transaction.CommitAsync();
                result.Result = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                DevNexusLogger.Instance.Debug(ex.Message);
                return ReturnError(result, $"An error occurred while voting on answer: {ex.Message}");
            }

            return result;
        }

        public async Task<ReturnResult<bool>> VoteCommentAsync(string commentId, VoteRequestDTO voteRequest)
        {
            var result = new ReturnResult<bool>();
            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                if (string.IsNullOrEmpty(commentId) || voteRequest == null)
                    return ReturnError(result, "Comment ID and vote data are required");

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                    return ReturnError(result, "User profile not found");

                if (!await _dbContext.Comments.AnyAsync(c => c.Id == commentId))
                    return ReturnError(result, $"Comment {commentId} not found");

                var existingVote = await _dbContext.Votes
                    .FirstOrDefaultAsync(v => v.AuthorId == profileId && v.CommentId == commentId);

                // Tái sử dụng hàm private
                var (upvoteChange, downvoteChange) = CalculateVoteDelta(existingVote, profileId, voteRequest.IsUpvote, commentId: commentId);

                await _dbContext.SaveChangesAsync();

                if (upvoteChange != 0 || downvoteChange != 0)
                {
                    await _dbContext.Comments
                        .Where(c => c.Id == commentId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(c => c.UpvoteCount, c => c.UpvoteCount + upvoteChange)
                            .SetProperty(c => c.DownvoteCount, c => c.DownvoteCount + downvoteChange));
                }

                await transaction.CommitAsync();
                result.Result = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                DevNexusLogger.Instance.Debug(ex.Message);
                return ReturnError(result, $"An error occurred while voting on comment: {ex.Message}");
            }

            return result;
        }

        private (int upvoteChange, int downvoteChange) CalculateVoteDelta(
            Vote? existingVote,
            string profileId,
            bool isUpvote,
            string? postId = null,
            string? answerId = null,
            string? commentId = null)
        {
            int upvoteChange = 0;
            int downvoteChange = 0;

            if (existingVote == null)
            {
                // Insert new vote
                _dbContext.Votes.Add(new Vote
                {
                    AuthorId = profileId,
                    PostId = postId,
                    AnswerId = answerId,
                    CommentId = commentId,
                    IsUpvote = isUpvote
                });

                if (isUpvote) upvoteChange = 1;
                else downvoteChange = 1;
            }
            else if (existingVote.IsUpvote == isUpvote)
            {
                // Toggle off (Remove vote)
                _dbContext.Votes.Remove(existingVote);

                if (isUpvote) upvoteChange = -1;
                else downvoteChange = -1;
            }
            else
            {
                // Switch direction
                existingVote.IsUpvote = isUpvote;

                if (isUpvote)
                {
                    upvoteChange = 1;
                    downvoteChange = -1;
                }
                else
                {
                    downvoteChange = 1;
                    upvoteChange = -1;
                }
            }

            return (upvoteChange, downvoteChange);
        }
        private ReturnResult<bool> ReturnError(ReturnResult<bool> result, string message)
        {
            result.Message = message;
            result.Result = false;
            return result;
        }
    }
}