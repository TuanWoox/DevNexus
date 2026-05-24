"use client";

import { CommunityPostActionsDropdown } from "./actions/community-post-actions-dropdown";
import { PersonalPostActionsDropdown } from "./actions/personal-post-actions-dropdown";

interface PostActionsDropdownProps {
    postId: string;
    communityId?: string | null;
    isQAPost: boolean;
    isAuthor: boolean;
    canModerateCommunity?: boolean;
    onDeleted?: () => void;
    dropdownClassName?: string;
}

export function PostActionsDropdown({
    postId,
    communityId,
    isQAPost,
    isAuthor,
    canModerateCommunity = false,
    onDeleted,
    dropdownClassName = "",
}: PostActionsDropdownProps) {
    if (communityId) {
        return (
            <CommunityPostActionsDropdown
                postId={postId}
                communityId={communityId}
                isQAPost={isQAPost}
                isAuthor={isAuthor}
                canModerateCommunity={canModerateCommunity}
                onDeleted={onDeleted}
                dropdownClassName={dropdownClassName}
            />
        );
    }

    return (
        <PersonalPostActionsDropdown
            postId={postId}
            isQAPost={isQAPost}
            isAuthor={isAuthor}
            onDeleted={onDeleted}
            dropdownClassName={dropdownClassName}
        />
    );
}
