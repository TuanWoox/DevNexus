using Microsoft.Extensions.Configuration;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using System.Net.Http.Json;

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
        public async Task<ReturnResult<AiUsageLogPageResponseDTO>> GetPageAiUsageLogsAsync(Page<string> page)
        {
            var result = new ReturnResult<AiUsageLogPageResponseDTO>();
            try
            {
                var requestBody = new AiWorkerPageRequestDTO
                {
                    PageNumber = page.PageNumber,
                    Size = page.Size,
                    Filters = (page.Filter ?? []).Select(f => new AiWorkerFilterMapping
                    {
                        Prop = f.Prop,
                        FilterType = f.FilterType.ToString(),
                        FilterOperator = f.FilterOperator?.ToString() ?? string.Empty,
                        Value = f.Value?.ToString(),
                    }).ToList(),
                    Orders = (page.Orders ?? []).Select(o => new AiWorkerOrderMapping
                    {
                        Sort = o.Sort,
                        SortDir = o.SortDir == SortOrderType.ASC ? "asc" : "desc",
                    }).ToList(),
                };
                var response = await _httpClient.PostAsJsonAsync(
                    $"{_baseUrl}/internal/ai-usage-logs/search",
                    requestBody
                );
                response.EnsureSuccessStatusCode();
                result.Result = await response.Content.ReadFromJsonAsync<AiUsageLogPageResponseDTO>();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] GetAiUsageLogsAsync failed: {ex.Message}");
                result.Message = $"Failed to fetch AI usage logs: {ex.Message}";
            }
            return result;

        }
    }
}
