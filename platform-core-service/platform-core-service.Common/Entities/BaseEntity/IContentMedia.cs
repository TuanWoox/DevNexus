namespace platform_core_service.Common.Entities.BaseEntity
{
    public interface IContentMedia : IBaseKey<string>, IDeleted
    {
        string StoreDestination { get; set; }
        string SHA256Hash { get; set; }
        string? GetCommunityId();
    }
}
