using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class AIFirstResponseRequestDTO
    {
        public string PostId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public List<string> Tags { get; set; }
        public string AuthorId { get; set; }
        public string AuthorDisplayName { get; set; }
        public DateTimeOffset CreatedAt { get; set; }

    }
}
