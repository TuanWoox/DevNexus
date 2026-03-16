using Microsoft.AspNetCore.Identity;
using platform_core_service.Common.Entities.BaseEntity;
using System.ComponentModel.DataAnnotations.Schema;

namespace platform_core_service.Common.Entities.Identities
{
    // IdentityUser implements IdentityUser<string> => auto-generates a GUID as Id in the constructor
    public class ApplicationUser : IdentityUser, ICreated, IModified, IDeleted
    {
        [Column("RefreshToken")]
        public string? RefreshToken { get; set; }
        [Column("RefreshTokenValidity")]
        public DateTime? RefreshTokenValidity { get; set; }
        public virtual ICollection<ApplicationUserRole> UserRoles { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public bool Deleted { get; set; }
        public DateTimeOffset? DateDeleted { get; set; }
    }
}
