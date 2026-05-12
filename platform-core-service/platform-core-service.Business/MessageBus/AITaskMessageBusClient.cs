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
    public class AITaskMessageBusClient : IMessageBusClient
    {
        private readonly IConfiguration _configuration;
        private IConnection _connection = null!;
        private IChannel _channel = null!;

        public AITaskMessageBusClient(IConfiguration configuration)
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
                    exchange: "devnexus_ai_tasks",
                    type: ExchangeType.Topic,
                    durable: true
                );

                DevNexusLogger.Instance.Info("AITaskMessageBusClient initialized - devnexus_ai_tasks exchange ready");
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                // Fail fast — do not leave _channel/connection in a half-initialized state
                throw;
            }
        }
        public async Task SendMessage(string message, string? routingKey = null)
        {
            if (_channel == null || !_channel.IsOpen)
                throw new InvalidOperationException("[AITaskMessageBusClient] RabbitMQ channel is not open. Initialization may have failed.");

            var body = Encoding.UTF8.GetBytes(message);

            if (string.IsNullOrEmpty(routingKey))
            {
                routingKey = "ai.default";
            }

            await _channel.BasicPublishAsync(
                exchange: "devnexus_ai_tasks",
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
            if (_channel is { IsOpen: true })
                await _channel.CloseAsync();

            if (_connection is { IsOpen: true })
                await _connection.CloseAsync();
        }
    }
}
