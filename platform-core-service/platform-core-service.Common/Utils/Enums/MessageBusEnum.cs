using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Utils.Enums
{
    public enum MessageBusEnum
    {
        Create,
        Update,
        Delete,
        BulkDelete,
    }

    public enum MessageBusEntityEnum
    {
        Profile,
        UserFollow,
        ProfileBlock
    }
}
