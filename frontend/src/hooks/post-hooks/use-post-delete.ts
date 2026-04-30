import { useState } from 'react';
import { useDeletePostById } from './use-delete-post-by-id';
import { useDeleteQAPostById } from '@/hooks/qa-post-hooks/use-delete-qa-post-by-id';

interface UsePostDeleteOptions {
    isQAPost: boolean;
    onDeleted?: () => void;
}

export function usePostDelete({ isQAPost, onDeleted }: UsePostDeleteOptions) {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePostById();
    const { mutate: deleteQAPost, isPending: isDeletingQAPost } = useDeleteQAPostById();

    const isPending = isDeletingPost || isDeletingQAPost;

    const handleDeleteConfirm = (postId: string) => {
        const mutationOptions = {
            onSuccess: () => {
                setShowDeleteAlert(false);
                onDeleted?.();
            },
            // Do NOT close the dialog on error — axiosConfig interceptor already shows
            // a toast.error, so we just leave the dialog open so the user knows the
            // delete failed and can retry or cancel manually.
        };

        if (isQAPost) {
            deleteQAPost(postId, mutationOptions);
        } else {
            deletePost(postId, mutationOptions);
        }
    };

    return {
        showDeleteAlert,
        setShowDeleteAlert,
        isPending,
        handleDeleteConfirm,
    };
}
