import { ContentType } from "../content-media/content-type";

export interface ReportContentDTO {
    communityId: string;
    contentId: string;
    contentType: ContentType;
    reason: string;
}