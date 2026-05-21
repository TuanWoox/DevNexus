import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import { CreateReportDTO } from "@/types/report/create-report-dto";
import { SelectReportDTO } from "@/types/report/select-report-dto";

export const reportService = {
  create: async (payload: CreateReportDTO): Promise<SelectReportDTO> => {
    const { data } = await api.post<ReturnResult<SelectReportDTO>>("/Reports", payload, {
      suppressToast: true,
    });

    if (!data.result) {
      throw new Error(data.message || "Could not submit report");
    }

    return data.result;
  },
};
