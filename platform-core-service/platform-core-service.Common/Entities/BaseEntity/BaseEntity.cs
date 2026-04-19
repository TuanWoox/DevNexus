using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.BaseEntity
{
    public interface IBaseKey<TKey>
    {
        public TKey Id { get; set; }
    }
    public class BaseKey : IBaseKey<string>
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string Id { get; set; }
    }
    public class BaseEntity<TKey> : IBaseKey<TKey>, IDeleted, ICreated, IModified
    {
        [Key]
        //[StringLength(36)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public TKey Id { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        [JsonIgnore]
        public bool Deleted { get; set; }
        [JsonIgnore]
        public DateTimeOffset? DateDeleted { get; set; }
    }
    public class BaseEntityVoteValue<TKey> : BaseEntity<TKey>, IVoteValue
    {
        public int UpvoteCount { get; set; } = 0;
        public int DownvoteCount { get; set; } = 0;
    }

    public class BaseEntityHardDelete<TKey> : IBaseKey<TKey>, ICreated, IModified
    {
        [Key]
        //[StringLength(36)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public TKey Id { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }

    public interface IDeleted
    {
        public bool Deleted { get; set; }
        public DateTimeOffset? DateDeleted { get; set; }
    }
    public interface ICreated
    {
        //Add this for SaveChangesAsync Work In Case Of EntityState.Added
        public DateTimeOffset? DateModified { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
    public interface IModified
    {
        public DateTimeOffset? DateModified { get; set; }
    }
    public interface IVoteValue
    {
        public int UpvoteCount { get; set; }
        public int DownvoteCount { get; set; }
    }
    public class BaseMediaEntity<TKey>: BaseEntity<TKey>
    {
        [JsonIgnore]
        public string StoreDestination { get; set; } = null!;
        public string SHA256Hash { get; set; } = null!;
    }
    public class BasePrimaryMediaEntity<TKey> : BaseMediaEntity<TKey>
    {
        public bool IsPrimary { get; set; } = true;
    }

}
