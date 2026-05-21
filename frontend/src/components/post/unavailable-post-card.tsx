'use client';

import { useState } from 'react';
import { EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
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
import { useDeleteBookmarkedItemById } from "@/hooks/bookmarked-item-hooks/use-delete-bookmarked-item-by-id";

interface UnavailablePostCardProps {
    bookmarkedItemId: string;
}

/**
 * A placeholder card for posts that are no longer available (deleted or private)
 * in a user's saved collection.
 */
export function UnavailablePostCard({ bookmarkedItemId }: UnavailablePostCardProps) {
    const [isUnsaveModalOpen, setIsUnsaveModalOpen] = useState(false);
    const { mutate: removeBookmark, isPending: isUnsavePending } = useDeleteBookmarkedItemById();

    const handleConfirmRemove = () => {
        removeBookmark(bookmarkedItemId);
        setIsUnsaveModalOpen(false);
    };

    return (
        <div className="card p-3 sm:px-5 flex flex-row gap-4 items-center relative animate-in fade-in slide-in-from-bottom-2 min-h-[140px]">
            {/* Left Placeholder Icon Box - Matches the visual in the reference image */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-xl flex items-center justify-center shrink-0 border border-default/50">
                <EyeOff className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/60" />
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-1.5 flex-1 pr-6">
                <h3 className="text-base sm:text-xl font-bold text-heading leading-tight">
                    This item isn't available right now.
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                    Its privacy settings may have changed or it has expired.
                </p>
            </div>

            {/* Options Dropdown - Top Right corner */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            aria-label="More Options"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border p-1">
                        <DropdownMenuItem
                            onClick={() => setIsUnsaveModalOpen(true)}
                            variant='destructive'
                            className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove from collection
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={isUnsaveModalOpen} onOpenChange={setIsUnsaveModalOpen}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from collection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this unavailable item from your collection?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUnsavePending} variant="custom" size="lg" className="btn-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleConfirmRemove(); }}
                            disabled={isUnsavePending}
                            variant="destructive"
                            size="lg"
                            className="cursor-pointer"
                        >
                            {isUnsavePending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

