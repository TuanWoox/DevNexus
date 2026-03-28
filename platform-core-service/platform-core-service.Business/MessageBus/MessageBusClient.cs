using AutoMapper;
using Microsoft.Extensions.Configuration;
using platform_core_service.Common.Interfaces.MessageBus;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Utils.Extensions;
using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace platform_core_service.Business.MessageBus
{
    public class MessageBusClient: IMessageBusClient
    {
        private readonly IConfiguration _configuration;
        private IConnection _connection = null!;
        private IChannel _channel = null!;

        public MessageBusClient(IConfiguration configuration)
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
                await _channel.ExchangeDeclareAsync(exchange: "devnexus_sync", type: ExchangeType.Fanout, durable: true);
            }
            catch(Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
        }
        public async Task SendMessage(string message)
        {
            var body = Encoding.UTF8.GetBytes(message);
            await _channel.BasicPublishAsync(exchange: "devnexus_sync", routingKey: string.Empty, body: body);
        }
        public async Task PublishEntity<TEntity>(PublishMessageBusDTO<TEntity> publishEntity)
        {
            var message = JsonSerializer.Serialize(publishEntity);
            await SendMessage(message);
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
