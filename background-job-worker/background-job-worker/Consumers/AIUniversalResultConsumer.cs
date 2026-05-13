using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Data;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace background_job_worker.Consumers
{
    public class AIUniversalResultConsumer : BackgroundService
    {
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AIUniversalResultConsumer> _logger;
        private IConnection _connection = null!;
        private IChannel _channel = null!;

        public AIUniversalResultConsumer(
            IConfiguration configuration,
            IServiceProvider serviceProvider,
            ILogger<AIUniversalResultConsumer> logger)
        {
            _configuration = configuration;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory
            {
                HostName = _configuration.GetSection("RabbitMQ").GetValue<string>("RabbitMQHost") ?? "localhost"
            };

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _connection = await factory.CreateConnectionAsync();
                    _channel = await _connection.CreateChannelAsync();

                    // 2. Setup Exchange Topic để nhận kết quả
                    var exchangeName = "devnexus_ai_responses";
                    await _channel.ExchangeDeclareAsync(exchange: exchangeName, type: ExchangeType.Topic, durable: true);

                    // Setup Queue dùng chung cho tất cả kết quả AI
                    var queueName = "ai_universal_results_queue";
                    await _channel.QueueDeclareAsync(queue: queueName, durable: true, exclusive: false, autoDelete: false);

                    // Hứng tất cả các message có routing key bắt đầu bằng "ai.response."
                    await _channel.QueueBindAsync(queue: queueName, exchange: exchangeName, routingKey: "ai.response.#");

                    _logger.LogInformation("AIUniversalResultConsumer initialized. Waiting for AI results...");

                    var consumer = new AsyncEventingBasicConsumer(_channel);

                    consumer.ReceivedAsync += async (model, ea) =>
                    {
                        try
                        {
                            var body = ea.Body.ToArray();
                            var message = Encoding.UTF8.GetString(body);
                            var routingKey = ea.RoutingKey; // CHÌA KHÓA ĐỂ ĐIỀU PHỐI

                            _logger.LogInformation($"[AI_Consumer] Received message with RoutingKey: {routingKey}");

                            // 3. ĐIỀU PHỐI TÁC VỤ (ROUTER)
                            switch (routingKey)
                            {
                                case "ai.response.firstresponder":
                                    await HandleFirstResponderResult(message);
                                    break;

                                // Tương lai thêm các tính năng khác ở đây:
                                // case "ai.response.summarize":
                                //     await HandleSummarizeResult(message);
                                //     break;

                                default:
                                    _logger.LogWarning($"[AI_Consumer] No handler found for routing key: {routingKey}");
                                    break;
                            }

                            // 4. Luôn ACK sau khi xử lý xong (dù thành công hay vào default)
                            await _channel.BasicAckAsync(deliveryTag: ea.DeliveryTag, multiple: false);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[AI_Consumer] Error processing message: {ex.Message}");
                            // NACK so the message is rejected to the DLQ rather than silently dropped
                            await _channel.BasicNackAsync(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
                        }
                    };

                    await _channel.BasicConsumeAsync(queue: queueName, autoAck: false, consumer: consumer);
                    await Task.Delay(Timeout.Infinite, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError($"RabbitMQ connection failed. Retrying in 5s... Error: {ex.Message}");

                    if (_channel is { IsOpen: true }) await _channel.CloseAsync();
                    if (_connection is { IsOpen: true }) await _connection.CloseAsync();

                    try { await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken); }
                    catch (TaskCanceledException) { break; }
                }
            }
        }

        private async Task HandleFirstResponderResult(string message)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var aiResult = JsonSerializer.Deserialize<AIFirstResponseResultDTO>(message, options);

            if (aiResult != null && aiResult.Success && !string.IsNullOrEmpty(aiResult.GeneratedComment))
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var post = await dbContext.Posts.FirstOrDefaultAsync(p => p.Id == aiResult.PostId);
                if (post != null)
                {
                    // Lấy ID Admin để làm tác giả comment
                    var adminId = await dbContext.Users
                        .Where(u => u.UserName == "admin")
                        .Select(u => u.Id)
                        .FirstOrDefaultAsync();

                    var authorId = adminId ?? post.AuthorId; // Fallback nếu không có admin

                    var answer = new Answer
                    {
                        Id = Guid.NewGuid().ToString(),
                        Content = aiResult.GeneratedComment,
                        AuthorId = authorId,
                        QAPostId = post.Id,
                        DateCreated = DateTimeOffset.UtcNow,
                        DateModified = DateTimeOffset.UtcNow,
                        Deleted = false
                    };

                    dbContext.Answers.Add(answer);
                    await dbContext.SaveChangesAsync();

                    _logger.LogInformation($"[AIFirstResponder] Successfully saved AI comment for post {aiResult.PostId}");
                }
                else
                {
                    _logger.LogWarning($"[AIFirstResponder] Post {aiResult.PostId} not found in DB.");
                }
            }
            else
            {
                _logger.LogWarning($"[AIFirstResponder] AI generation failed or empty. Error: {aiResult?.ErrorMessage}");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_channel is { IsOpen: true }) await _channel.CloseAsync();
            if (_connection is { IsOpen: true }) await _connection.CloseAsync();
            await base.StopAsync(cancellationToken);
        }
    }
}
