using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Setting
{
    public class AppConfiguration
    {
        public string GeminiApiKey { get; set; } = string.Empty;
        public List<string> BannedKeywords { get; set; } = new List<string>();
    }
}
