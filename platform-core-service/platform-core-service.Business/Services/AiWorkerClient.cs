using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace platform_core_service.Business.Services
{
    public class AiWorkerClient : IAiWorkerClient
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _baseUrl;

        public AiWorkerClient(
            HttpClient httpClient,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;
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

        public async Task<ReturnResult<AISummarizeResponseDTO>> SummarizeContentAsync(AISummarizeRequestDTO request)
        {
            var result = new ReturnResult<AISummarizeResponseDTO>();
            try
            {
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{_baseUrl}/ai/content/summarize")
                {
                    Content = JsonContent.Create(request),
                };

                ForwardAuthorizationHeader(httpRequest);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    DevNexusLogger.Instance.Warn(
                        $"[AiWorkerClient] SummarizeContent returned {(int)response.StatusCode}: {errorBody}");
                    result.Message = $"AI worker could not generate a summary. Status: {(int)response.StatusCode}.";
                    return result;
                }

                var summary = await response.Content.ReadFromJsonAsync<AISummarizeResponseDTO>();
                if (summary == null)
                {
                    result.Message = "AI worker returned an empty summary response.";
                    return result;
                }

                result.Result = summary;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] SummarizeContentAsync failed: {ex.Message}");
                result.Message = $"Failed to generate AI summary: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<AIMetadataResponseDTO>> SuggestMetadataAsync(AIMetadataRequestDTO request)
        {
            var result = new ReturnResult<AIMetadataResponseDTO>();
            try
            {
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{_baseUrl}/ai/content/metadata")
                {
                    Content = JsonContent.Create(request),
                };

                ForwardAuthorizationHeader(httpRequest);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    DevNexusLogger.Instance.Warn(
                        $"[AiWorkerClient] SuggestMetadata returned {(int)response.StatusCode}: {errorBody}");
                    result.Message = $"Failed to generate AI metadata. AI worker returned {(int)response.StatusCode}.";
                    return result;
                }

                var metadata = await response.Content.ReadFromJsonAsync<AIMetadataResponseDTO>();
                if (metadata == null)
                {
                    result.Message = "AI worker returned an empty metadata response.";
                    return result;
                }

                result.Result = metadata;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] SuggestMetadataAsync failed: {ex.Message}");
                result.Message = $"Failed to generate AI metadata: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<AICodeExplainResponseDTO>> ExplainCodeAsync(AICodeExplainRequestDTO request)
        {
            var result = new ReturnResult<AICodeExplainResponseDTO>();
            try
            {
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{_baseUrl}/ai/code/explain")
                {
                    Content = JsonContent.Create(request),
                };

                ForwardAuthorizationHeader(httpRequest);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    DevNexusLogger.Instance.Warn(
                        $"[AiWorkerClient] ExplainCode returned {(int)response.StatusCode}: {errorBody}");
                    result.Message = $"AI worker could not explain code. Status: {(int)response.StatusCode}.";
                    return result;
                }

                var explanation = await response.Content.ReadFromJsonAsync<AICodeExplainResponseDTO>();
                if (explanation == null)
                {
                    result.Message = "AI worker returned an empty code explanation response.";
                    return result;
                }

                result.Result = explanation;
            }
            catch (TaskCanceledException ex)
            {
                DevNexusLogger.Instance.Warn($"[AiWorkerClient] ExplainCodeAsync timed out: {ex.Message}");
                result.Message = "AI generation timed out. Please try again shortly.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] ExplainCodeAsync failed: {ex.Message}");
                result.Message = "Could not generate AI result. Please try again.";
            }

            return result;
        }

        public async Task<ReturnResult<AICodeDiagramResponseDTO>> GenerateCodeDiagramAsync(AICodeDiagramRequestDTO request)
        {
            var result = new ReturnResult<AICodeDiagramResponseDTO>();
            try
            {
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"{_baseUrl}/ai/code/diagram")
                {
                    Content = JsonContent.Create(new AICodeDiagramRequestDTO
                    {
                        Code = request.Code,
                        Language = request.Language,
                        DiagramType = request.DiagramType,
                        PostId = request.PostId,
                    }),
                };

                ForwardAuthorizationHeader(httpRequest);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    DevNexusLogger.Instance.Warn(
                        $"[AiWorkerClient] GenerateCodeDiagram returned {(int)response.StatusCode}: {errorBody}");
                    result.Message = $"AI worker could not generate a code diagram. Status: {(int)response.StatusCode}.";
                    return result;
                }

                var diagram = await response.Content.ReadFromJsonAsync<AICodeDiagramResponseDTO>();
                if (diagram == null)
                {
                    result.Message = "AI worker returned an empty code diagram response.";
                    return result;
                }

                result.Result = diagram;
            }
            catch (TaskCanceledException ex)
            {
                DevNexusLogger.Instance.Warn($"[AiWorkerClient] GenerateCodeDiagramAsync timed out: {ex.Message}");
                result.Message = "AI generation timed out. Please try again shortly.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] GenerateCodeDiagramAsync failed: {ex.Message}");
                result.Message = "Could not generate AI result. Please try again.";
            }

            return result;
        }

        public async Task<ReturnResult<bool>> UpdateUsageInteractionAsync(
            int usageLogId,
            AIUsageInteractionUpdateRequestDTO request)
        {
            var result = new ReturnResult<bool>();
            try
            {
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Patch,
                    $"{_baseUrl}/ai/usage-logs/{usageLogId}/interaction")
                {
                    Content = JsonContent.Create(request),
                };

                ForwardAuthorizationHeader(httpRequest);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    DevNexusLogger.Instance.Warn(
                        $"[AiWorkerClient] UpdateUsageInteraction returned {(int)response.StatusCode}: {errorBody}");
                    result.Message = $"Failed to update AI usage interaction. AI worker returned {(int)response.StatusCode}.";
                    return result;
                }

                result.Result = await response.Content.ReadFromJsonAsync<bool>();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"[AiWorkerClient] UpdateUsageInteractionAsync failed: {ex.Message}");
                result.Message = $"Failed to update AI usage interaction: {ex.Message}";
            }

            return result;
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

        private void ForwardAuthorizationHeader(HttpRequestMessage httpRequest)
        {
            var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrWhiteSpace(authorizationHeader) &&
                AuthenticationHeaderValue.TryParse(authorizationHeader, out var parsedAuthorizationHeader))
            {
                httpRequest.Headers.Authorization = parsedAuthorizationHeader;
            }
        }
    }
}
