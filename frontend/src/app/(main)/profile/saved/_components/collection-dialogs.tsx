"use client";

import { Loader2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateCollectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    onNameChange: (name: string) => void;
    onConfirm: () => void;
    isPending: boolean;
}

export const CreateCollectionDialog = ({
    isOpen,
    onOpenChange,
    name,
    onNameChange,
    onConfirm,
    isPending
}: CreateCollectionDialogProps) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl shadow-2xl border-border" showCloseButton={false}>
            <DialogHeader>
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold tracking-tight">New Collection</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full cursor-pointer"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </DialogHeader>
            <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Collection name..."
                className="rounded-xl border-border focus:ring-primary h-11"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onConfirm();
                }}
            />
            <div className="flex justify-end gap-3">
                <Button variant="ghost" size="lg" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white transition-all shadow-sm shadow-primary/20 cursor-pointer"
                    size="lg"
                    onClick={onConfirm}
                    disabled={isPending || !name.trim()}
                >
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);

interface EditCollectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    onNameChange: (name: string) => void;
    onConfirm: () => void;
    isPending: boolean;
}

export const EditCollectionDialog = ({
    isOpen,
    onOpenChange,
    name,
    onNameChange,
    onConfirm,
    isPending
}: EditCollectionDialogProps) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl shadow-2xl border-border" showCloseButton={false}>
            <DialogHeader>
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold tracking-tight">Edit Collection Name</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full cursor-pointer"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </DialogHeader>
            <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Collection name..."
                className="rounded-xl border-border focus:ring-primary h-11"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onConfirm();
                }}
            />
            <div className="flex justify-end gap-3">
                <Button variant="ghost" size="lg" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white transition-all shadow-sm shadow-primary/20 cursor-pointer"
                    onClick={onConfirm}
                    size="lg"
                    disabled={isPending || !name.trim()}
                >
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);
