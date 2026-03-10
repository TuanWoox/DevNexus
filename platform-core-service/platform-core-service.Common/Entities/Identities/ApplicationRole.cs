using Microsoft.AspNetCore.Identity;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.Identities
{
    public class ApplicationRole : IdentityRole<string>, ICreated, IDeleted, IModified
    {
        public virtual ICollection<ApplicationUserRole> UserRoles { get; set; }
        public virtual DateTimeOffset? DateCreated { get; set; }

        public virtual DateTimeOffset? DateModified { get; set; }

        public virtual bool Deleted { get; set; }
        public virtual DateTimeOffset? DateDeleted { get; set; }
    }
}
