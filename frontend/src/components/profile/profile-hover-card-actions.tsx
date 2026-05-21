'use client';

import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBlockProfile } from '@/hooks/block-hooks/use-block-profile';
import { useBlockStatus } from '@/hooks/block-hooks/use-block-status';
import { useUnblockProfile } from '@/hooks/block-hooks/use-unblock-profile';

interface ProfileHoverCardActionsProps {
    profileId: string;
    onClose?: () => void;
}

export function ProfileHoverCardActions({ profileId, onClose }: ProfileHoverCardActionsProps) {
    const [statusEnabled, setStatusEnabled] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data: blockStatus, isLoading: isStatusLoading } = useBlockStatus(statusEnabled ? profileId : null);
    const blockProfile = useBlockProfile(profileId);
    const unblockProfile = useUnblockProfile(blockStatus?.blockId ?? null, profileId);

    const isBlocked = blockStatus?.iBlockedThem ?? false;
    const isPending = blockProfile.isPending || unblockProfile.isPending;

    const handleBlockClick = () => {
        setStatusEnabled(true);
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        const mutation = isBlocked ? unblockProfile : blockProfile;
        mutation.mutate(undefined, {
            onSuccess: () => {
                setDialogOpen(false);
                onClose?.();
            },
        });
    };

    return (
        <div className="border-t border-border px-4 py-3">
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    onClick={handleBlockClick}
                    disabled={isPending}
                >
                    {isStatusLoading || isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Ban className="mr-2 h-4 w-4" />
                    )}
                    {isStatusLoading ? 'Checking...' : isBlocked ? 'Unblock' : 'Block'}
                </Button>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isBlocked ? 'Unblock profile?' : 'Block profile?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isBlocked
                                ? 'This profile can message and interact with you again.'
                                : 'This profile cannot message you or interact with your content after blocking.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending} variant="custom" size="lg" className="btn-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            size="lg"
                            className="cursor-pointer"
                            disabled={isStatusLoading || isPending}
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirm();
                            }}
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isBlocked ? 'Unblock' : 'Block'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
