import { BaseSelectCommunityReportDTO } from "../community-content-report/base-select-community-report-dto";
import { SelectReportedPostDTO } from "../community-content-report/select-reported-content-dto";

export interface SelectCommunityPostsReportDTO extends BaseSelectCommunityReportDTO {
    postId: string;
    post?: SelectReportedPostDTO | null;
}
