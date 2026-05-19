namespace platform_core_service.Common.Entities.BaseEntity
{
    public interface IPrimaryMedia : IBaseKey<string>, IDeleted
    {
        string StoreDestination { get; set; }
        string SHA256Hash { get; set; }
        bool IsPrimary { get; set; }

        string GetOwnerId();
    }
}
