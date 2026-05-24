"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PendingPostFooterProps {
    isBusy: boolean;
    onApprove: () => void;
    onReject: (reason: string, onSuccess: () => void) => void;
}

export function PendingPostFooter({ isBusy, onApprove, onReject }: PendingPostFooterProps) {
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);

    const handleConfirmReject = () => {
        onReject(reason.trim(), () => {
            setOpen(false);
            setReason("");
        });
    };

    return (
        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 bg-card">
            {/* Rejection Dialog Trigger */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={isBusy}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all font-semibold flex items-center gap-1.5 h-9 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                        Reject Post
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-heading">
                            Reject Content Submission
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Add a constructive explanation for the author to understand why their content was not approved.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="my-4">
                        <Textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Provide details about what guidelines were not met (e.g., duplicate post, off-topic, spam)..."
                            maxLength={1000}
                            rows={5}
                            className="w-full text-sm resize-none rounded-lg focus-visible:ring-destructive/30"
                        />
                        <div className="flex justify-end mt-1 text-2xs text-muted-foreground">
                            {reason.length}/1000 characters
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isBusy}
                            className="font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmReject}
                            disabled={isBusy || !reason.trim()}
                            className="font-semibold flex items-center gap-1.5"
                        >
                            {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approval Button */}
            <button
                onClick={onApprove}
                disabled={isBusy}
                className="btn-emerald font-semibold flex items-center gap-1.5 h-9 shadow-md"
            >
                {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Check className="h-4 w-4" />
                )}
                Approve Post
            </button>
        </div>
    );
}
