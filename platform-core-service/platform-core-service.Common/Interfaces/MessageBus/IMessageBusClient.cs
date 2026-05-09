using AutoMapper;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;

namespace platform_core_service.Common.Interfaces.MessageBus
{
    public interface IMessageBusClient
    {
        Task SendMessage(string message, string? routingKey = null);

        Task PublishEntity<TEntity>(PublishMessageBusDTO<TEntity> publishEntity, string? routingKey = null);
    }
}
