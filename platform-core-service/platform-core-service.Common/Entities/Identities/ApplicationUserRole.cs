using Microsoft.AspNetCore.Identity;
using platform_core_service.Common.Entities.BaseEntity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.Identities
{
    public class ApplicationUserRole : IdentityUserRole<string>, ICreated, IDeleted, IModified
    {
        public virtual ApplicationUser User { get; set; }
        public virtual ApplicationRole Role { get; set; }

        public bool Deleted { get; set; } = false;
        public DateTimeOffset? DateDeleted { get; set; }
        public virtual DateTimeOffset? DateCreated { get; set; }

        public virtual DateTimeOffset? DateModified { get; set; }
    }
}
