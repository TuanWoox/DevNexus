"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash, UserPlus, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { usePostDelete } from "@/hooks/post-hooks/use-post-delete";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { ReportDialog } from "@/components/report/report-dialog";
import { ReportTargetType } from "@/types/report/report-target-type";

interface PersonalPostActionsDropdownProps {
    postId: string;
    isQAPost: boolean;
    isAuthor: boolean;
    onDeleted?: () => void;
    dropdownClassName?: string;
}

export function PersonalPostActionsDropdown({
    postId,
    isQAPost,
    isAuthor,
    onDeleted,
    dropdownClassName = "",
}: PersonalPostActionsDropdownProps) {
    const hasMounted = useHasMounted();
    const router = useRouter();
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const basePath = isQAPost ? "/questions" : "/post";
    const { showDeleteAlert, setShowDeleteAlert, isPending, handleDeleteConfirm } = usePostDelete({
        isQAPost,
        onDeleted,
    });

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
                        </>
                    )}
                    {isAuthor && (
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
                </DropdownMenuContent>
            </DropdownMenu>

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
