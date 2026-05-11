using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.MessageBus;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Dapper.SqlMapper;

namespace background_job_worker.Jobs
{
    public class PublishMessageBackgroundJobs : IPublishMessageBackgroundJobs
    {
        private readonly IMessageBusClient _defaultClient;
        private readonly IMessageBusClient _notificationClient;
        private readonly IMessageBusClient _aiClient;

        public PublishMessageBackgroundJobs(
        [FromKeyedServices("default")] IMessageBusClient defaultClient,
        [FromKeyedServices("notification")] IMessageBusClient notificationClient,
        [FromKeyedServices("aitask")] IMessageBusClient aiClient)
        {
            _defaultClient = defaultClient;
            _notificationClient = notificationClient;
            _aiClient = aiClient;
        }
        public async Task PublishEntity<TEntity>(TEntity entity, MessageBusEnum messageBus, MessageBusEntityEnum messageBusEntity)
        {
            var newPublish = new PublishMessageBusDTO<TEntity>
            {
                Entity = entity,
                MessageBusEnum = messageBus,
                MessageBusEntityEnum = messageBusEntity
            };
            await _defaultClient.PublishEntity(newPublish);
        }

        public async Task PublicNotification<TEntity>(TEntity entity, string routingKey)
        {
            var newPublish = new PublishMessageBusDTO<TEntity>
            {
                Entity = entity,
                MessageBusEnum = MessageBusEnum.Create,
                MessageBusEntityEnum = MessageBusEntityEnum.Notification
            };
            await _notificationClient.PublishEntity(newPublish, routingKey);
        }
        public async Task PublicAiTask<TEntity>(TEntity entity, string routingKey, MessageBusEnum messageBus, MessageBusEntityEnum messageBusEntity)
        {
            var newPublish = new PublishMessageBusDTO<TEntity>
            {
                Entity = entity,
                MessageBusEnum = messageBus,
                MessageBusEntityEnum = messageBusEntity
            };
            await _aiClient.PublishEntity(newPublish, routingKey);
        }

    }
}
