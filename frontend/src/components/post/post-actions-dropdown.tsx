"use client";

import { CommunityPostActionsDropdown } from "./actions/community-post-actions-dropdown";
import { PersonalPostActionsDropdown } from "./actions/personal-post-actions-dropdown";

interface PostActionsDropdownProps {
    postId: string;
    communityId?: string | null;
    isQAPost: boolean;
    isAuthor: boolean;
    canModerateCommunity?: boolean;
    isRecommendation?: boolean;
    isFlagged?: boolean;
    onDeleted?: () => void;
    dropdownClassName?: string;
}

export function PostActionsDropdown({
    postId,
    communityId,
    isQAPost,
    isAuthor,
    canModerateCommunity = false,
    isRecommendation = false,
    isFlagged = false,
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
                isRecommendation={isRecommendation}
                isFlagged={isFlagged}
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
            isRecommendation={isRecommendation}
            isFlagged={isFlagged}
            onDeleted={onDeleted}
            dropdownClassName={dropdownClassName}
        />
    );
}
