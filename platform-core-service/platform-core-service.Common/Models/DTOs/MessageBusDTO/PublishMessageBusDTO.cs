using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class PublishMessageBusDTO<TEntity>
    {
        [Required]
        public TEntity Entity { get; set; } = default!;
        [Required]
        public MessageBusEnum MessageBusEnum { get; set; }

        [Required]
        public MessageBusEntityEnum MessageBusEntityEnum { get; set; }

    }
}
