import { ReportStatus } from "./report-status";
import { ReportResolutionAction } from "./report-resolution-action";

export interface SelectCommunityReportProfileDTO {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    bio?: string | null;
    reputationPoints?: number;
    techStacks?: string[];
    isPrivate?: boolean;
}

export interface SelectCommunityReportCommunityDTO {
    id: string;
    name: string;
    slug: string;
    communityCoverPhotoUrl?: string | null;
}

export interface BaseSelectCommunityReportDTO {
    id: string;
    communityId: string;
    community?: SelectCommunityReportCommunityDTO | null;
    reporterId: string;
    reporter?: SelectCommunityReportProfileDTO | null;
    reportedProfileId: string;
    reportedProfile?: SelectCommunityReportProfileDTO | null;
    reason: string;
    status: ReportStatus;
    resolvedById?: string | null;
    resolvedBy?: SelectCommunityReportProfileDTO | null;
    resolutionNotes?: string | null;
    resolutionAction: ReportResolutionAction;
    dateCreated?: string | null;
    dateModified?: string | null;
}
