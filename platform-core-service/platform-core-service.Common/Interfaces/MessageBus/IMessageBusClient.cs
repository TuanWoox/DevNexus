using AutoMapper;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;

namespace platform_core_service.Common.Interfaces.MessageBus
{
    public interface IMessageBusClient 
    {
        public Task SendMessage(string message);
        public Task PublishEntity<TEntity>(PublishMessageBusDTO<TEntity> publishEntity);
    }
}
