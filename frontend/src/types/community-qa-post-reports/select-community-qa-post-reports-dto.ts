import { BaseSelectCommunityReportDTO } from "../community-content-report/base-select-community-report-dto";
import { SelectReportedQAPostDTO } from "../community-content-report/select-reported-content-dto";

export interface SelectCommunityQAPostReportsDTO extends BaseSelectCommunityReportDTO {
    qaPostId: string;
    qaPost?: SelectReportedQAPostDTO | null;
}
