"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ProfileHeader } from "./profile-header";
import { ProfileInfo } from "./profile-info";
import { ProfileTabs } from "./profile-tabs";
import { ProfileContent } from "./profile-content";
import { EditProfileModal } from "./edit-profile-modal";
import { ChangePasswordModal } from "./change-password-modal";
import { ProfileNotFound } from "./profile-not-found";

import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { useBlockStatus } from "@/hooks/block-hooks/use-block-status";

interface ProfileViewWrapperProps {
    profileId: string;
    currentProfileId?: string;
}

export function ProfileViewWrapper({ profileId, currentProfileId }: ProfileViewWrapperProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "post" | "qa-post" | "saved">("overview");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const { data: profile, isLoading } = useGetProfileById(profileId);
    const { user } = useSelector((state: RootState) => state.auth);
    const viewerProfileId = currentProfileId || user?.profileId;
    const isOwnProfileCandidate = viewerProfileId === profileId;
    const { data: blockStatus } = useBlockStatus(!isOwnProfileCandidate ? profileId : null);

    if (!profile) {
        return isLoading ? null : <ProfileNotFound />;
    }
    // Use currentProfileId from server to ensure consistent SSR and hydration.
    // Falls back to user?.profileId from Redux on the client if needed.
    const isOwnProfile = viewerProfileId === profile.id;

    if (!isOwnProfile && (blockStatus?.iBlockedThem || blockStatus?.theyBlockedMe)) {
        return <ProfileNotFound />;
    }

    const visibleActiveTab = !profile.canViewProfile && activeTab !== "overview" ? "overview" : activeTab;

    return (
        <div className="flex flex-col w-full min-h-screen fade-in">
            <div className="bg-card shadow-card mb-2">
                {/* Full-width cover + avatar section */}
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                />

                {/* Constrained content area */}
                <ProfileInfo
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onEdit={() => setIsEditModalOpen(true)}
                    onChangePassword={() => setIsChangePasswordOpen(true)}
                />

                <ProfileTabs
                    activeTab={visibleActiveTab}
                    setActiveTab={setActiveTab}
                    isOwnProfile={isOwnProfile}
                    canViewContent={profile.canViewProfile}
                />
            </div>

            <ProfileContent
                activeTab={visibleActiveTab}
                targetProfileId={profile.id}
                isOwnProfile={isOwnProfile}
                isPrivate={profile.isPrivate}
                canViewContent={profile.canViewProfile}
            />

            {isOwnProfile && (
                <>
                    <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        currentProfile={profile}
                    />
                    <ChangePasswordModal
                        isOpen={isChangePasswordOpen}
                        onClose={() => setIsChangePasswordOpen(false)}
                    />
                </>
            )}
        </div>
    );
}



