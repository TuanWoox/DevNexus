using Microsoft.Extensions.Configuration;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Business.Services
{
    /// <summary>
    /// Sends fire-and-forget HTTP requests to the Python AI Worker service.
    /// Uses IHttpClientFactory for connection pooling and proper socket management.
    /// NEVER throws — all errors are logged and swallowed so the calling service is not disrupted.
    /// </summary>
    public class AiWorkerClient : IAiWorkerClient
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _baseUrl;

        public AiWorkerClient(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _baseUrl = configuration["AiWorker:BaseUrl"]
                       ?? throw new InvalidOperationException("AiWorker:BaseUrl is not configured.");
        }

        /// <inheritdoc />
        public Task SubmitForModerationAsync(string postId, string textContent)
        {
            // Build multipart form to match Python endpoint: POST /ai/moderation/submit
            // Python router expects: post_id (Form), text_content (Form)
            var form = new MultipartFormDataContent
            {
                { new StringContent(postId),      "post_id"      },
                { new StringContent(textContent), "text_content" },
            };

            // Fire-and-forget: errors are intentionally swallowed.
            // A moderation failure must NEVER break the post creation response.
            _ = Task.Run(async () =>
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var response = await client.PostAsync($"{_baseUrl}/ai/moderation/submit", form);

                    if (!response.IsSuccessStatusCode)
                    {
                        DevNexusLogger.Instance.Warning(
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
                    // Log but never rethrow — the caller has already returned 200 to the user
                    DevNexusLogger.Instance.Error(
                        $"[AiWorkerClient] Failed to submit post {postId} for moderation: {ex.Message}");
                }
            });

            return Task.CompletedTask;
        }
    }
}
