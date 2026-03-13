using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Utils.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum SettingDataType
    {
        String = 1,
        Integer = 2,
        Boolean = 3,
        Json = 4,
        DateTime = 5
    }
}
