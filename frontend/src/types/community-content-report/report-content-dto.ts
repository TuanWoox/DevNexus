import { ContentType } from "../content-media/content-type";

export interface ReportContentDTO {
    contentId: string;
    contentType: ContentType;
    reason: string;
}
