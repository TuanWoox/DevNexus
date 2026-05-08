"use client";

import { Trash2, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteAllMessages } from "@/features/messages/hooks/chatsettings/use-delete-all-messages";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteAllMessagesSectionProps {
    chatSettingId: string;
    onDeleted: () => void;
}

export function DeleteAllMessagesSection({ chatSettingId, onDeleted }: DeleteAllMessagesSectionProps) {
    const deleteAllMessages = useDeleteAllMessages();
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        deleteAllMessages.mutate(chatSettingId, {
            onSuccess: (data) => {
                if (data.result) {
                    toast.success("Messages cleared");
                    setOpen(false);
                    onDeleted();
                } else {
                    toast.error(data.message ?? "Failed to clear messages");
                }
            },
            onError: () => {
                toast.error("Failed to clear messages");
            },
        });
    };

    return (
        <div className="px-4 py-4">
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 active:scale-[0.98]"
                        disabled={deleteAllMessages.isPending}
                    >
                        {deleteAllMessages.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Delete All Messages
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete all messages?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently clear all messages in this conversation for you.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAllMessages.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteAllMessages.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAllMessages.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
