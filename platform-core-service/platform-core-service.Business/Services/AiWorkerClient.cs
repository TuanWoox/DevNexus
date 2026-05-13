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

        public Task SubmitForModerationAsync(string postId, string title, string textContent)
        {
            var moderationText = BuildModerationText(title, textContent);
            var form = new MultipartFormDataContent
            {
                { new StringContent(postId),         "post_id"      },
                { new StringContent(title ?? string.Empty), "title" },
                { new StringContent(moderationText), "text_content" },
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

        private static string BuildModerationText(string? title, string? textContent)
        {
            var parts = new[]
            {
                string.IsNullOrWhiteSpace(title) ? null : $"Title: {title.Trim()}",
                string.IsNullOrWhiteSpace(textContent) ? null : $"Content: {textContent.Trim()}",
            };

            return string.Join(Environment.NewLine + Environment.NewLine, parts.Where(p => p != null));
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

        public async Task<ReturnResult<AdminAiUsageSummaryDTO>> GetSummaryAsync(DateOnly from, DateOnly to)
        {
            var result = new ReturnResult<AdminAiUsageSummaryDTO>();
            try
            {
                var url = $"{_baseUrl}/internal/ai-usage-logs/summary?from={from:yyyy-MM-dd}&to={to:yyyy-MM-dd}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                result.Result = await response.Content.ReadFromJsonAsync<AdminAiUsageSummaryDTO>();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] GetSummaryAsync failed: {ex.Message}");
                result.Message = $"Failed to fetch AI usage summary: {ex.Message}";
            }
            return result;
        }
    }
}
