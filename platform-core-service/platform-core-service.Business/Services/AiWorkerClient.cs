using Microsoft.Extensions.Configuration;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Business.Services
{
    public class AiWorkerClient : IAiWorkerClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public AiWorkerClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _baseUrl = configuration["AiWorker:BaseUrl"]
                       ?? throw new InvalidOperationException("AiWorker:BaseUrl is not configured.");
            
            var internalKey = configuration["InternalApi:AiWorkerKey"]
                              ?? throw new InvalidOperationException("InternalApi:AiWorkerKey is not configured.");
            
            _httpClient.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalKey);
        }

        public Task SubmitForModerationAsync(string postId, string textContent)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent(postId),      "post_id"      },
                { new StringContent(textContent), "text_content" },
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    var response = await _httpClient.PostAsync($"{_baseUrl}/ai/moderation/submit", form);

                    if (!response.IsSuccessStatusCode)
                    {
                        DevNexusLogger.Instance.Warn(
                            $"[AiWorkerClient] Moderation submit returned {(int)response.StatusCode} for post {postId}.");
                    }
                    else
                    {
                        DevNexusLogger.Instance.Debug(
                            $"[AiWorkerClient] Moderation submit accepted for post {postId}.");
                    }
                }
                catch (Exception ex)
                {
                    DevNexusLogger.Instance.Error(
                        $"[AiWorkerClient] Failed to submit post {postId} for moderation: {ex.Message}");
                }
            });

            return Task.CompletedTask;
        }
    }
}
