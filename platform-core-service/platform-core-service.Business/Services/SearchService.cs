using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Search;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Services
{
    public class SearchService : ISearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;

        public SearchService(ApplicationDbContext context, IUserContext userContext)
        {
            _context = context;
            _userContext = userContext;
        }

        public async Task<ReturnResult<GlobalSearchResultDTO>> SearchAllAsync(Page<string> page, CancellationToken cancellationToken = default)
        {
            var query = GetSearchQuery(page);
            var size = page.Size > 0 ? page.Size : 5;

            if (string.IsNullOrWhiteSpace(query))
            {
                return new ReturnResult<GlobalSearchResultDTO> { Result = new GlobalSearchResultDTO() };
            }

            var posts = await SearchPostsPreviewAsync(query, size, cancellationToken);
            var qaPosts = await SearchQAPostsPreviewAsync(query, size, cancellationToken);
            var communities = await SearchCommunitiesPreviewAsync(query, size, cancellationToken);
            var profiles = await SearchProfilesPreviewAsync(query, size, cancellationToken);

            return new ReturnResult<GlobalSearchResultDTO>
            {
                Result = new GlobalSearchResultDTO
                {
                    Posts = posts,
                    QAPosts = qaPosts,
                    Communities = communities,
                    Profiles = profiles
                }
            };
        }

        public async Task<PagedData<SearchPostResultDTO, string>> SearchPostsAsync(Page<string> page, CancellationToken cancellationToken = default)
        {
            var query = GetSearchQuery(page);
            var postsQuery = ApplyPostSearch(GetVisiblePosts().Where(p => p.GetType() == typeof(PostEntity)), query)
                .OrderByDescending(p => p.DateCreated);

            return await ToPagedDataAsync(postsQuery, page, ProjectPost(), cancellationToken);
        }

        public async Task<PagedData<SearchQAPostResultDTO, string>> SearchQAPostsAsync(Page<string> page, CancellationToken cancellationToken = default)
        {
            var query = GetSearchQuery(page);
            var qaPostsQuery = ApplyQAPostSearch(GetVisibleQAPosts(), query)
                .OrderByDescending(p => p.DateCreated);

            return await ToPagedDataAsync(qaPostsQuery, page, ProjectQAPost(), cancellationToken);
        }

        public async Task<PagedData<SearchCommunityResultDTO, string>> SearchCommunitiesAsync(Page<string> page, CancellationToken cancellationToken = default)
        {
            var query = GetSearchQuery(page);
            var communitiesQuery = ApplyCommunitySearch(GetVisibleCommunities(), query)
                .OrderByDescending(c => c.Members.Count);

            return await ToPagedDataAsync(communitiesQuery, page, ProjectCommunity, cancellationToken);
        }

        public async Task<PagedData<SearchProfileResultDTO, string>> SearchProfilesAsync(Page<string> page, CancellationToken cancellationToken = default)
        {
            var query = GetSearchQuery(page);
            var profilesQuery = ApplyProfileSearch(GetVisibleProfiles(), query)
                .OrderByDescending(p => p.ReputationPoints);

            return await ToPagedDataAsync(profilesQuery, page, ProjectProfile, cancellationToken);
        }

        private async Task<List<SearchPostResultDTO>> SearchPostsPreviewAsync(string query, int size, CancellationToken cancellationToken)
        {
            return await ApplyPostSearch(GetVisiblePosts().Where(p => p.GetType() == typeof(PostEntity)), query)
                .OrderByDescending(p => p.DateCreated)
                .Take(size)
                .Select(ProjectPost())
                .ToListAsync(cancellationToken);
        }

        private async Task<List<SearchQAPostResultDTO>> SearchQAPostsPreviewAsync(string query, int size, CancellationToken cancellationToken)
        {
            return await ApplyQAPostSearch(GetVisibleQAPosts(), query)
                .OrderByDescending(p => p.DateCreated)
                .Take(size)
                .Select(ProjectQAPost())
                .ToListAsync(cancellationToken);
        }

        private async Task<List<SearchCommunityResultDTO>> SearchCommunitiesPreviewAsync(string query, int size, CancellationToken cancellationToken)
        {
            return await ApplyCommunitySearch(GetVisibleCommunities(), query)
                .OrderByDescending(c => c.Members.Count)
                .Take(size)
                .Select(ProjectCommunity)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<SearchProfileResultDTO>> SearchProfilesPreviewAsync(string query, int size, CancellationToken cancellationToken)
        {
            return await ApplyProfileSearch(GetVisibleProfiles(), query)
                .OrderByDescending(p => p.ReputationPoints)
                .Take(size)
                .Select(ProjectProfile)
                .ToListAsync(cancellationToken);
        }

        private IQueryable<PostEntity> GetVisiblePosts()
        {
            var currentProfileId = _userContext.ProfileId;

            return _context.Posts
                .AsNoTracking()
                .ApplyPostVisibilityRules(_context, currentProfileId);
        }

        private IQueryable<QAPost> GetVisibleQAPosts()
        {
            var currentProfileId = _userContext.ProfileId;

            return _context.Posts
                .OfType<QAPost>()
                .AsNoTracking()
                .ApplyQAPostVisibilityRules(_context, currentProfileId);
        }

        private IQueryable<Community> GetVisibleCommunities()
        {
            var currentProfileId = _userContext.ProfileId;

            return _context.Communities
                .AsNoTracking()
                .ApplyCommunityVisibilityRules(_context, currentProfileId);
        }

        private IQueryable<Profile> GetVisibleProfiles()
        {
            var currentProfileId = _userContext.ProfileId;

            return _context.Profiles
                .AsNoTracking()
                .ApplyProfileVisibilityRules(_context, currentProfileId);
        }

        private static IQueryable<PostEntity> ApplyPostSearch(IQueryable<PostEntity> query, string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery)) return query;

            var lowerQuery = searchQuery.ToLower();
            return query.Where(p =>
                p.Title.ToLower().Contains(lowerQuery) ||
                p.Content.ToLower().Contains(lowerQuery) ||
                p.Author.FullName.ToLower().Contains(lowerQuery) ||
                (p.Community != null && p.Community.Name.ToLower().Contains(lowerQuery)));
        }

        private static IQueryable<QAPost> ApplyQAPostSearch(IQueryable<QAPost> query, string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery)) return query;

            var lowerQuery = searchQuery.ToLower();
            return query.Where(p =>
                p.Title.ToLower().Contains(lowerQuery) ||
                p.Content.ToLower().Contains(lowerQuery) ||
                p.Author.FullName.ToLower().Contains(lowerQuery) ||
                (p.Community != null && p.Community.Name.ToLower().Contains(lowerQuery)));
        }

        private static IQueryable<Community> ApplyCommunitySearch(IQueryable<Community> query, string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery)) return query;

            var lowerQuery = searchQuery.ToLower();
            return query.Where(c =>
                c.Name.ToLower().Contains(lowerQuery) ||
                (c.Description != null && c.Description.ToLower().Contains(lowerQuery)));
        }

        private static IQueryable<Profile> ApplyProfileSearch(IQueryable<Profile> query, string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery)) return query;

            var lowerQuery = searchQuery.ToLower();
            return query.Where(p =>
                p.FullName.ToLower().Contains(lowerQuery) ||
                (p.Bio != null && p.Bio.ToLower().Contains(lowerQuery)) ||
                p.TechStacks.Any(t => t.ToLower().Contains(lowerQuery)));
        }

        private static async Task<PagedData<TDto, string>> ToPagedDataAsync<TEntity, TDto>(
            IQueryable<TEntity> query,
            Page<string> page,
            System.Linq.Expressions.Expression<Func<TEntity, TDto>> projection,
            CancellationToken cancellationToken)
        {
            var size = page.Size > 0 ? page.Size : 20;
            var pageNumber = page.PageNumber < 0 ? 0 : page.PageNumber;
            var totalElements = await query.CountAsync(cancellationToken);

            page.Size = size;
            page.PageNumber = pageNumber;
            page.TotalElements = totalElements;

            var data = await query
                .Skip(pageNumber * size)
                .Take(size)
                .Select(projection)
                .ToListAsync(cancellationToken);

            return new PagedData<TDto, string>(page) { Data = data };
        }

        private System.Linq.Expressions.Expression<Func<PostEntity, SearchPostResultDTO>> ProjectPost()
        {
            return p => new SearchPostResultDTO
            {
                Id = p.Id,
                Title = p.Title,
                Content = p.Content,
                Slug = p.Slug,
                AuthorId = p.AuthorId,
                Author = new SearchPostAuthorDTO
                {
                    Id = p.Author.Id,
                    FullName = p.Author.FullName,
                    AvatarUrl = p.Author.AvatarUrl,
                    BackgroundUrl = p.Author.BackgroundUrl,
                    Bio = p.Author.Bio,
                    ReputationPoints = p.Author.ReputationPoints,
                    TechStacks = p.Author.TechStacks,
                    IsPrivate = p.Author.IsPrivate
                },
                UpvoteCount = p.UpvoteCount,
                CommentCount = _context.Comments.Count(c => c.PostId == p.Id),
                DateCreated = p.DateCreated,
                CommunityId = p.CommunityId,
                CommunityName = p.Community != null ? p.Community.Name : null
            };
        }

        private System.Linq.Expressions.Expression<Func<QAPost, SearchQAPostResultDTO>> ProjectQAPost()
        {
            return p => new SearchQAPostResultDTO
            {
                Id = p.Id,
                Title = p.Title,
                Content = p.Content,
                Slug = p.Slug,
                AuthorId = p.AuthorId,
                Author = new SearchPostAuthorDTO
                {
                    Id = p.Author.Id,
                    FullName = p.Author.FullName,
                    AvatarUrl = p.Author.AvatarUrl,
                    BackgroundUrl = p.Author.BackgroundUrl,
                    Bio = p.Author.Bio,
                    ReputationPoints = p.Author.ReputationPoints,
                    TechStacks = p.Author.TechStacks,
                    IsPrivate = p.Author.IsPrivate
                },
                UpvoteCount = p.UpvoteCount,
                CommentCount = _context.Comments.Count(c => c.PostId == p.Id),
                DateCreated = p.DateCreated,
                CommunityId = p.CommunityId,
                CommunityName = p.Community != null ? p.Community.Name : null,
                AnswerCount = p.Answers.Count()
            };
        }

        private static readonly System.Linq.Expressions.Expression<Func<Community, SearchCommunityResultDTO>> ProjectCommunity = c => new SearchCommunityResultDTO
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Slug = c.Slug,
            CommunityCoverPhotoUrl = c.CommunityCoverPhotoUrl,
            MemberCount = c.Members.Count,
            IsPrivate = c.IsPrivate
        };

        private static readonly System.Linq.Expressions.Expression<Func<Profile, SearchProfileResultDTO>> ProjectProfile = p => new SearchProfileResultDTO
        {
            Id = p.Id,
            FullName = p.FullName,
            AvatarUrl = p.AvatarUrl,
            Bio = p.Bio,
            ReputationPoints = p.ReputationPoints,
            TechStacks = p.TechStacks,
            IsPrivate = p.IsPrivate
        };

        private static string GetSearchQuery(Page<string> page)
        {
            return page.Filter?
                .FirstOrDefault(f => string.Equals(f.Prop, "Query", StringComparison.OrdinalIgnoreCase))
                ?.Value
                ?.ToString()
                ?.Trim() ?? string.Empty;
        }
    }
}
