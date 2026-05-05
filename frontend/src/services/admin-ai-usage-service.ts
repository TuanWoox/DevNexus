import api from "@/lib/axiosConfig";
import { AdminAiUsageSummaryDTO, AiUsageLogDTO } from "@/types/admin/ai-usage-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

// ── Paging raw shapes (Newtonsoft camelCase from C# AiUsageLogPageResponseDTO) ──
interface RawAiUsageLog {
  id: number;
  featureName: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  userId?: string;
  createdAt: string;
}

interface RawAiUsageLogsResponse {
  data: RawAiUsageLog[];
  page: number;
  pageSize: number;
  total: number;
}

// ── Summary raw shapes (Newtonsoft camelCase from C# AdminAiUsageSummaryDTO) ──
interface RawAiUsageByModel {
  model: string;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RawAiUsageByFeature {
  feature: string;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RawAiUsageByDate {
  date: string;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RawAdminAiUsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  byModel: RawAiUsageByModel[];
  byFeature: RawAiUsageByFeature[];
  byDate: RawAiUsageByDate[];
}

export const adminAiUsageService = {
  getSummary: async (from: string, to: string): Promise<AdminAiUsageSummaryDTO> => {
    const { data } = await api.get<ReturnResult<RawAdminAiUsageSummary>>('/aiusagelogs/summary', {
      params: { from, to },
    });
    const raw = data.result;

    // Normalize camelCase Newtonsoft response → snake_case DTO
    return {
      total_calls: raw.totalCalls ?? 0,
      total_input_tokens: raw.totalInputTokens ?? 0,
      total_output_tokens: raw.totalOutputTokens ?? 0,
      total_tokens: raw.totalTokens ?? 0,
      by_model: (raw.byModel ?? []).map((r) => ({
        model: r.model,
        call_count: r.callCount,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        total_tokens: r.totalTokens,
      })),
      by_feature: (raw.byFeature ?? []).map((r) => ({
        feature: r.feature,
        call_count: r.callCount,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        total_tokens: r.totalTokens,
      })),
      by_date: (raw.byDate ?? []).map((r) => ({
        date: r.date,
        call_count: r.callCount,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        total_tokens: r.totalTokens,
      })),
    };
  },

  getPaging: async (payload: Page<string>): Promise<PagedData<AiUsageLogDTO, string>> => {
    const { data } = await api.post<ReturnResult<RawAiUsageLogsResponse>>('/aiusagelogs/paging', payload);
    const raw = data.result;

    // Normalize camelCase API response → snake_case DTO + PagedData shape
    return {
      data: raw.data.map((item) => ({
        id: item.id,
        feature_name: item.featureName,
        model_used: item.modelUsed,
        input_tokens: item.inputTokens,
        output_tokens: item.outputTokens,
        total_tokens: item.totalTokens,
        user_id: item.userId,
        created_at: item.createdAt,
      })),
      page: {
        pageNumber: (raw.page ?? 1) - 1, // API is 1-based, frontend is 0-based
        size: raw.pageSize ?? payload.size,
        totalElements: raw.total ?? 0,
        orders: payload.orders ?? [],
        filter: payload.filter ?? [],
        selected: payload.selected ?? [],
      },
    };
  },
};
