using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.Identities;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Profile : BaseEntity<string>
    {
        [ForeignKey(nameof(ApplicationUser))]
        public string ApplicationUserId { get; set; }

        [JsonIgnore]
        public ApplicationUser ApplicationUser { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }

        [MaxLength(500)]
        public string? BackgroundUrl { get; set; }

        [MaxLength(500)]
        public string Bio { get; set; }

        [Range(0, int.MaxValue)]
        public int ReputationPoints { get; set; } = 0;

        [MaxLength(100)]
        public List<string> TechStacks { get; set; }

        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<Community> Communities { get; set; } = new List<Community>();

        [JsonIgnore]
        public ICollection<CommunityModerator> ModeratedCommunities { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityMember> CommunityMemberships { get; set; } = [];
        [JsonIgnore]
        public ICollection<CommunityMembershipRequest> MembershipRequests { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(CommunityBan.BannedProfile))]
        public ICollection<CommunityBan> BanRecords { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(CommunityBan.BannedBy))]
        public ICollection<CommunityBan> BansIssued { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(ProfileBlock.Owner))]
        public ICollection<ProfileBlock> BlockRecords { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(ProfileBlock.BlockedProfile))]
        public ICollection<ProfileBlock> BlockedByRecords { get; set; } = [];

        public bool IsPrivate { get; set; } = false;
        [JsonIgnore]
        [InverseProperty(nameof(UserFollow.Owner))]
        public ICollection<UserFollow> Following { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(UserFollow.FollowingProfile))]
        public ICollection<UserFollow> Followers { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(FollowRequest.RequesterProfile))]
        public ICollection<FollowRequest> SentFollowRequests { get; set; } = [];

        [JsonIgnore]
        [InverseProperty(nameof(FollowRequest.TargetProfile))]
        public ICollection<FollowRequest> ReceivedFollowRequests { get; set; } = [];

        [JsonIgnore]
        public ICollection<BookMark> BookMarks { get; set; } = [];

        [JsonIgnore]
        //Make it virtual so when later we access => EF core will automatically load for us
        public virtual ICollection<ProfileMedia> ProfileMedias { get; set; } = [];
    }
}