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
        private IMessageBusClient _messageBusClient;

        public PublishMessageBackgroundJobs(IMessageBusClient messageBusClient)
        {
            _messageBusClient = messageBusClient;
        }
        public async Task PublishEntity<TEntity>(TEntity entity, MessageBusEnum messageBus, MessageBusEntityEnum messageBusEntity)
        {
            var newPublish = new PublishMessageBusDTO<TEntity>
            {
                Entity = entity,
                MessageBusEnum = messageBus,
                MessageBusEntityEnum = messageBusEntity
            };
            await _messageBusClient.PublishEntity(newPublish);
        }
    }
}
