import { BaseSelectCommunityReportDTO } from "../community-content-report/base-select-community-report-dto";
import { SelectReportedCommentDTO } from "../community-content-report/select-reported-content-dto";

export interface SelectCommunityCommentsReportDTO extends BaseSelectCommunityReportDTO {
    commentId: string;
    comment?: SelectReportedCommentDTO | null;
}
