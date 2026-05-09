using Microsoft.Extensions.Configuration;
using platform_core_service.Common.Interfaces.MessageBus;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Utils.Extensions;
using RabbitMQ.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace platform_core_service.Business.MessageBus
{
    public class NotificationMessageBusClient : IMessageBusClient
    {
        private readonly IConfiguration _configuration;
        private IConnection _connection = null!;
        private IChannel _channel = null!;

        public NotificationMessageBusClient(IConfiguration configuration)
        {
            _configuration = configuration;
            InitializeRabbitMq().GetAwaiter().GetResult();
        }
        private async Task InitializeRabbitMq()
        {
            var factory = new ConnectionFactory
            {
                HostName = _configuration.GetSection("RabbitMQ").GetValue<string>("RabbitMQHost") ?? "localhost",
            };
            try
            {
                _connection = await factory.CreateConnectionAsync();
                _channel = await _connection.CreateChannelAsync();

                await _channel.ExchangeDeclareAsync(
                    exchange: "devnexus_notifications",
                    type: ExchangeType.Topic,  
                    durable: true
                );

                DevNexusLogger.Instance.Info("NotificationMessageBusClient initialized - devnexus_notifications (topic) exchange ready");
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
        }
        public async Task SendMessage(string message, string? routingKey = null)
        {
            var body = Encoding.UTF8.GetBytes(message);

            if (string.IsNullOrEmpty(routingKey))
            {
                routingKey = "notifications.default"; // better default
            }

            await _channel.BasicPublishAsync(
                exchange: "devnexus_notifications",
                routingKey: routingKey,
                body: body
            );
        }

        public async Task PublishEntity<TEntity>(PublishMessageBusDTO<TEntity> publishEntity, string? routingKey = null)
        {
            var message = JsonSerializer.Serialize(publishEntity);
            await SendMessage(message, routingKey);
        }

        public async Task Dispose()
        {
            if (_channel.IsOpen)
            {
                await _channel.CloseAsync();
                await _connection.CloseAsync();
            }
        }
    }
}
