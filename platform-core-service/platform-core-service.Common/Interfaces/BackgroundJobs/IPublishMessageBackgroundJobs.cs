using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IPublishMessageBackgroundJobs
    {
        public Task PublishEntity<TEntity>(TEntity entity,MessageBusEnum messageBus, MessageBusEntityEnum messageBusEntity);
        public Task PublicNotification<TEntity>(TEntity entity, string routingKey);
        public Task PublicAiTask<TEntity>(TEntity entity, string routingKey, MessageBusEnum messageBus, MessageBusEntityEnum messageBusEntity);
    }
}
