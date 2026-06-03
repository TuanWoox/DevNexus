"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash, UserPlus, Flag, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubmitRecommendationFeedback } from "@/hooks/recommendation-hooks/use-submit-recommendation-feedback";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePostDelete } from "@/hooks/post-hooks/use-post-delete";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useCreateCommunityContentReport } from "@/hooks/community-content-report-hooks/use-create-community-content-report";
import { ContentType } from "@/types/content-media/content-type";
import { ReportDialog } from "@/components/report/report-dialog";
import { ReportTargetType } from "@/types/report/report-target-type";

interface CommunityPostActionsDropdownProps {
    postId: string;
    communityId: string;
    isQAPost: boolean;
    isAuthor: boolean;
    canModerateCommunity: boolean;
    isRecommendation?: boolean;
    onDeleted?: () => void;
    dropdownClassName?: string;
}

export function CommunityPostActionsDropdown({
    postId,
    communityId,
    isQAPost,
    isAuthor,
    canModerateCommunity,
    isRecommendation = false,
    onDeleted,
    dropdownClassName = "",
}: CommunityPostActionsDropdownProps) {
    const hasMounted = useHasMounted();
    const router = useRouter();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const basePath = isQAPost ? "/questions" : "/post";
    const { showDeleteAlert, setShowDeleteAlert, isPending, handleDeleteConfirm } = usePostDelete({
        isQAPost,
        onDeleted,
    });
    const reportMutation = useCreateCommunityContentReport();
    const canReportToCommunity = !isAuthor;
    const canDelete = isAuthor || canModerateCommunity;
    const isReportReasonValid = reportReason.trim().length >= 5 && reportReason.trim().length <= 500;
    const submitFeedback = useSubmitRecommendationFeedback();

    const handleFeedback = (feedbackType: 'not_interested' | 'hide' | 'report_irrelevant') => {
        submitFeedback.mutate(
            isQAPost ? { qaPostId: postId, feedbackType } : { postId: postId, feedbackType }
        );
    };

    const handleSubmitReport = () => {
        if (!isReportReasonValid) return;

        reportMutation.mutate(
            {
                communityId,
                payload: {
                    contentId: postId,
                    contentType: isQAPost ? ContentType.QA : ContentType.Post,
                    reason: reportReason.trim(),
                },
            },
            {
                onSuccess: (created) => {
                    if (created) {
                        setReportReason("");
                        setIsReportOpen(false);
                    }
                },
            }
        );
    };

    if (!hasMounted) {
        return (
            <div className={`p-2 text-muted-foreground transition-colors ${dropdownClassName}`} aria-label="More options">
                <MoreHorizontal className="w-5 h-5" />
            </div>
        );
    }

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <div
                        className={`p-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dropdownClassName} cursor-pointer`}
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-42 bg-card border rounded-xl shadow-elevated p-1 z-10">
                    {isAuthor ? (
                        <DropdownMenuItem
                            onClick={() => router.push(`${basePath}/edit/${postId}`)}
                            className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Edit Post</span>
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium">
                                <UserPlus className="w-4 h-4" />
                                <span>Follow User</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setReportDialogOpen(true)}
                                variant="destructive"
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <Flag className="w-4 h-4" />
                                <span>Report to Site</span>
                            </DropdownMenuItem>
                            {canReportToCommunity && (
                                <DropdownMenuItem
                                    onClick={() => setIsReportOpen(true)}
                                    variant="destructive"
                                    className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                >
                                    <Flag className="w-4 h-4" />
                                    <span>Report to Community</span>
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                    {canDelete && (
                        <DropdownMenuItem
                            onClick={() => setShowDeleteAlert(true)}
                            disabled={isPending}
                            variant="destructive"
                            className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                        >
                            <Trash className="w-4 h-4" />
                            <span>Delete Post</span>
                        </DropdownMenuItem>
                    )}
                    {isRecommendation && (
                        <>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem
                                onClick={() => handleFeedback('not_interested')}
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <EyeOff className="w-4 h-4" />
                                <span>Not Interested</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleFeedback('hide')}
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                                <span>Hide Post</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleFeedback('report_irrelevant')}
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <Flag className="w-4 h-4 text-muted-foreground" />
                                <span>Not Relevant</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={isReportOpen}
                onOpenChange={(open) => {
                    if (!reportMutation.isPending) setIsReportOpen(open);
                }}
            >
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Report to community</DialogTitle>
                        <DialogDescription>
                            Send this {isQAPost ? "question" : "post"} to community moderators for review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Textarea
                            value={reportReason}
                            onChange={(event) => setReportReason(event.target.value)}
                            maxLength={500}
                            placeholder="Describe the issue..."
                            className="min-h-28 resize-none"
                            disabled={reportMutation.isPending}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Minimum 5 characters.</span>
                            <span>{reportReason.trim().length}/500</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={reportMutation.isPending} onClick={() => setIsReportOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!isReportReasonValid || reportMutation.isPending}
                            onClick={handleSubmitReport}
                        >
                            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={(open) => {
                    if (!isPending) setShowDeleteAlert(open);
                }}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>{`Once you delete this post, it can't be restored.`}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending} variant="custom" size="lg" className="btn-secondary">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteConfirm(postId);
                            }}
                            variant="destructive"
                            disabled={isPending}
                            size="lg"
                            className="cursor-pointer"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {!isAuthor && (
                <ReportDialog
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                    targetType={isQAPost ? ReportTargetType.Question : ReportTargetType.Post}
                    targetId={postId}
                    targetLabel={isQAPost ? "Question" : "Post"}
                />
            )}
        </>
    );
}
