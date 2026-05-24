using System.Linq;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using Hangfire;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Business.Helper;

namespace platform_core_service.Business.Services
{
    public class CommunityMemberService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        ISocialGuardService socialGuardService,
        IRepository<CommunityMember, string> memberRepository,
        IBackgroundJobClient backgroundJobClient) : ICommunityMemberService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly ISocialGuardService _socialGuardService = socialGuardService;
        private readonly IRepository<CommunityMember, string> _memberRepository = memberRepository;
        private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;

        private async Task<bool> IsOwnerOrModeratorAsync(string communityId, string profileId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community?.OwnerId == profileId) return true;

            return await _context.CommunityModerators
                .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
        }

        public async Task<ReturnResult<object>> JoinAsync(string communityId)
        {
            var result = new ReturnResult<object>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load community
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 4: Owner cannot join their own community (they are the admin)
                if (community.OwnerId == profileId)
                {
                    result.Message = "You are the owner of this community";
                    return result;
                }

                // Step 5: Check if already a member
                var alreadyMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == communityId && m.ProfileId == profileId);

                if (alreadyMember)
                {
                    result.Message = "You are already a member of this community";
                    return result;
                }

                // Step 6: Check if user is banned
                var isBanned = await _context.CommunityBans
                    .AnyAsync(b => b.CommunityId == communityId && b.BannedProfileId == profileId);

                if (isBanned)
                {
                    result.Message = "You have been banned from this community";
                    return result;
                }

                // Step 7: Check if there's already a pending request
                var hasRequest = await _context.CommunityMembershipRequests
                    .AnyAsync(r => r.CommunityId == communityId && r.RequesterId == profileId);

                if (hasRequest)
                {
                    result.Message = "You already have a pending join request for this community";
                    return result;
                }

                // Step 8: Public community → add directly as member
                if (!community.IsPrivate)
                {
                    var member = new CommunityMember
                    {
                        Id = Guid.NewGuid().ToString(),
                        CommunityId = communityId,
                        ProfileId = profileId
                    };

                    _context.CommunityMembers.Add(member);
                    await _context.SaveChangesAsync();

                    var saved = await _context.CommunityMembers
                        .Include(m => m.Profile)
                        .FirstAsync(m => m.Id == member.Id);

                    await PublishMemberJoinedNotificationAsync(communityId, profileId);
                    await PublishMemberJoinedToAdminsNotificationAsync(communityId, profileId);

                    result.Result = _mapper.Map<SelectCommunityMemberDTO>(saved);
                    return result;
                }

                // Step 9: Private community → create pending request
                var request = new CommunityMembershipRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    CommunityId = communityId,
                    RequesterId = profileId
                };

                _context.CommunityMembershipRequests.Add(request);
                await _context.SaveChangesAsync();

                var savedRequest = await _context.CommunityMembershipRequests
                    .Include(r => r.Requester)
                    .FirstAsync(r => r.Id == request.Id);

                await PublishJoinRequestNotificationAsync(communityId, profileId);

                result.Result = _mapper.Map<SelectCommunityMembershipRequestDTO>(savedRequest);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while joining community: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> LeaveAsync(string communityId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load community
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 4: Owner cannot leave their community
                if (community.OwnerId == profileId)
                {
                    result.Message = "The community owner cannot leave. Transfer ownership or delete the community instead.";
                    return result;
                }

                // Step 5: Find member record
                var member = await _context.CommunityMembers
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.ProfileId == profileId);

                if (member == null)
                {
                    result.Message = "You are not a member of this community";
                    return result;
                }

                // Step 6: If the leaving member is a moderator, also remove their moderator record
                var moderatorEntry = await _context.CommunityModerators
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);

                if (moderatorEntry != null)
                    _context.CommunityModerators.Remove(moderatorEntry);

                // Step 7: Hard-delete member record
                _context.CommunityMembers.Remove(member);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while leaving community: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>> GetMembersAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityMemberDTO, string>>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                var viewerProfileId = _userContext.ProfileId;
                var communityAccess = await _socialGuardService.CheckBelongToCommunity(communityId);
                if (!communityAccess.Result)
                {
                    result.Message = communityAccess.Message ?? ResponseMessage.COMMUNITY_ACCESS_REQUIRED;
                    return result;
                }

                var isManager = !string.IsNullOrEmpty(viewerProfileId)
                    && await IsOwnerOrModeratorAsync(communityId, viewerProfileId);

                // Step 2: Build query (public endpoint)
                var query = _context.CommunityMembers
                    .Include(m => m.Profile)
                    .Where(m => m.CommunityId == communityId)
                    .AsQueryable();

                if (!isManager && !string.IsNullOrEmpty(viewerProfileId))
                {
                    query = query.Where(m => !_context.ProfileBlocks.Any(b =>
                        (b.OwnerId == viewerProfileId && b.BlockedProfileId == m.ProfileId) ||
                        (b.OwnerId == m.ProfileId && b.BlockedProfileId == viewerProfileId)));
                }

                result.Result = await _memberRepository.GetPagingAsync<Page<string>, SelectCommunityMemberDTO>(query, page);

                if (isManager && result.Result?.Data != null)
                {
                    await ApplyManagementPrivacyAsync(viewerProfileId, result.Result.Data);
                }

                // Step 3: Prepend owner's profile on the first page
                if (page.PageNumber == 0 && result.Result?.Data != null)
                {
                    // Check for search filter (Profile.FullName)
                    var searchTerm = page.Filter?.FirstOrDefault(f => f.Prop == "Profile.FullName")?.Value?.ToString();

                    var community = await _context.Communities
                        .Include(c => c.Owner)
                        .FirstOrDefaultAsync(c => c.Id == communityId);

                    if (community?.Owner != null)
                    {
                        var ownerBlockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                            _context,
                            viewerProfileId,
                            [community.OwnerId]);
                        var ownerBlocked = ownerBlockedIds.Contains(community.OwnerId);

                        if (ownerBlocked && !isManager)
                            return result;

                        // Only prepend if no search term OR owner's name matches the search term
                        if (string.IsNullOrEmpty(searchTerm) || community.Owner.FullName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                        {
                            var ownerProfile = _mapper.Map<Common.Models.DTOs.EntityDTO.Profile.SelectProfileDTO>(community.Owner);
                            var ownerAsMember = new SelectCommunityMemberDTO
                            {
                                Id = $"owner-{community.OwnerId}",
                                CommunityId = communityId,
                                ProfileId = community.OwnerId,
                                Profile = CommunityManagementPrivacyHelper.ToManagementProfile(ownerProfile, ownerBlocked),
                                DateCreated = community.DateCreated,
                                IsOwner = true,
                                HasBlockedRelation = ownerBlocked,
                                IsProfileRestricted = ownerBlocked,
                                RestrictedMessage = ownerBlocked ? ResponseMessage.BLOCKED_OR_NOT_AVAILABLE : null,
                                CanBan = false,
                                CanRemove = false,
                                CanPromote = false
                            };

                            var dataList = result.Result.Data.ToList();
                            dataList.Insert(0, ownerAsMember);
                            result.Result.Data = dataList;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving members: {ex.Message}";
            }
            return result;
        }

        private async Task ApplyManagementPrivacyAsync(string viewerProfileId, IEnumerable<SelectCommunityMemberDTO> members)
        {
            var memberList = members.ToList();
            var blockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                _context,
                viewerProfileId,
                memberList.Select(x => x.ProfileId));

            foreach (var item in memberList)
            {
                var isBlocked = blockedIds.Contains(item.ProfileId);
                item.HasBlockedRelation = isBlocked;
                item.IsProfileRestricted = isBlocked;
                item.RestrictedMessage = isBlocked ? ResponseMessage.BLOCKED_OR_NOT_AVAILABLE : null;
                item.CanPromote = !isBlocked;
                item.CanRemove = true;
                item.CanBan = true;
                item.Profile = CommunityManagementPrivacyHelper.ToManagementProfile(item.Profile, isBlocked);
            }
        }

        private async Task PublishJoinRequestNotificationAsync(string communityId, string requesterId)
        {
            var community = await _context.Communities
                .AsNoTracking()
                .Where(c => c.Id == communityId)
                .Select(c => new { c.Id, c.Name, c.OwnerId, c.CommunityCoverPhotoUrl })
                .FirstOrDefaultAsync();

            if (community == null) return;

            var moderators = await _context.CommunityModerators
                .Where(m => m.CommunityId == communityId)
                .Select(m => m.ModeratorId)
                .ToListAsync();

            var recipients = new List<string> { community.OwnerId };
            recipients.AddRange(moderators);
            recipients = recipients.Distinct().Where(id => id != requesterId).ToList();
            recipients = await FilterBlockedRecipientsAsync(requesterId, recipients);

            if (!recipients.Any()) return;

            var actor = await GetProfileSnapshot(requesterId);
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.COMMUNITY_JOIN_REQUEST,
                ActorType = ActorType.Community,
                ActorId = communityId,
                ActorName = community.Name,
                ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                RecipientId = recipients,
                EntityType = NotificationEntityType.COMMUNITY,
                EntityId = community.Id,
                EntityTitle = community.Name,
                EntityPreview = null,
                Message = $"New join request! {actor.Name} wants to join \"{community.Name}\". Tap to review.",
                ActionUrl = $"/communities/{community.Id}/settings?tab=requests",
                Timestamp = DateTime.UtcNow
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.community"));
        }

        private async Task PublishMemberJoinedNotificationAsync(string communityId, string newMemberId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community == null) return;
            if (await HasBlockedRelationAsync(community.OwnerId, newMemberId)) return;

            var actor = await GetProfileSnapshot(community.OwnerId);
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.COMMUNITY_ROLE_CHANGE,
                ActorType = ActorType.Community,
                ActorId = communityId,
                ActorName = community.Name,
                ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                RecipientId = newMemberId,
                EntityType = NotificationEntityType.COMMUNITY,
                EntityId = community.Id,
                EntityTitle = community.Name,
                EntityPreview = null,
                ActionUrl = $"/communities/{community.Id}",
                Timestamp = DateTime.UtcNow,
                Message = $"Welcome to \"{community.Name}\". Now you can post, connect with other members and more."
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.community"));
        }

        private async Task PublishMemberJoinedToAdminsNotificationAsync(string communityId, string newMemberId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community == null) return;

            var moderators = await _context.CommunityModerators
                .Where(m => m.CommunityId == communityId)
                .Select(m => m.ModeratorId)
                .ToListAsync();

            var recipients = new List<string> { community.OwnerId };
            recipients.AddRange(moderators);
            recipients = recipients.Distinct().Where(id => id != newMemberId).ToList();
            recipients = await FilterBlockedRecipientsAsync(newMemberId, recipients);

            if (!recipients.Any()) return;

            var actor = await GetProfileSnapshot(newMemberId);
            var notificationEvent = new NotiicationCreatedEntityDTO
            {
                EventType = NotificationEventType.COMMUNITY_ROLE_CHANGE,
                ActorType = ActorType.Community,
                ActorId = communityId,
                ActorName = community.Name,
                ActorAvatarUrl = community.CommunityCoverPhotoUrl,
                RecipientId = recipients,
                EntityType = NotificationEntityType.COMMUNITY,
                EntityId = community.Id,
                EntityTitle = community.Name,
                EntityPreview = null,
                ActionUrl = $"/profile/{newMemberId}",
                Timestamp = DateTime.UtcNow,
                Message = $"A new member has joined \"{community.Name}\". Please check their profile."
            };

            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                x => x.PublicNotification(notificationEvent, "notifications.community"));
        }

        private async Task<(string? Name, string? AvatarUrl)> GetProfileSnapshot(string profileId)
        {
            var profile = await _context.Profiles
                .Where(p => p.Id == profileId)
                .Select(p => new { p.FullName, p.AvatarUrl })
                .FirstOrDefaultAsync();

            return (profile?.FullName, profile?.AvatarUrl);
        }

        private async Task<List<string>> FilterBlockedRecipientsAsync(string actorId, IEnumerable<string> recipientIds)
        {
            var recipients = recipientIds.Distinct().ToList();
            var blockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                _context,
                actorId,
                recipients);

            return recipients.Where(id => !blockedIds.Contains(id)).ToList();
        }

        private async Task<bool> HasBlockedRelationAsync(string profileAId, string profileBId)
        {
            var blockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                _context,
                profileAId,
                [profileBId]);

            return blockedIds.Contains(profileBId);
        }
    }
}

