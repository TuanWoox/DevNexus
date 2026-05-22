import { BaseSelectCommunityReportDTO } from "../community-content-report/base-select-community-report-dto";
import { SelectReportedAnswerDTO } from "../community-content-report/select-reported-content-dto";

export interface SelectCommunityAnswersReportDTO extends BaseSelectCommunityReportDTO {
    answerId: string;
    answer?: SelectReportedAnswerDTO | null;
}
