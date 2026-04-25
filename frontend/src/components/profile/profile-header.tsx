"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon } from "lucide-react";
import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { ProfileMediaType } from "@/types/profile-media/profile-media-type";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { ProfileMediaUploadModal } from "@/components/profile/avatar-upload-modal";

interface ProfileHeaderProps {
    profile: SelectProfileDTO;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

    return (
        <>
            {/* Background / Cover Image */}
            <div
                className={`w-full h-48 md:h-64 relative bg-muted transition-opacity ${isOwnProfile ? 'group cursor-pointer' : ''}`}
                onClick={() => { if (isOwnProfile) setIsBackgroundModalOpen(true) }}
            >
                <Image
                    src={profile.backgroundUrl || "https://images.unsplash.com/photo-1707343843437-caacff5cfa74"}
                    alt="Cover Image"
                    fill
                    priority
                    unoptimized
                    className={`object-cover ${isOwnProfile ? 'transition-opacity group-hover:opacity-80' : ''}`}
                />
                {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-center text-white">
                            <ImageIcon className="w-10 h-10 mb-2" />
                            <span className="font-semibold shadow-sm text-lg">Update Cover</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 md:px-8 max-w-5xl mx-auto w-full">
                {/* Profile Header (Avatar and Actions) */}
                <div className="relative flex justify-between items-end -mt-16 md:-mt-20 mb-4">
                    <div
                        className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center shadow-sm transition-transform ${isOwnProfile ? 'cursor-pointer group hover:scale-[1.02]' : ''}`}
                        onClick={() => { if (isOwnProfile) setIsAvatarModalOpen(true) }}
                    >
                        {profile.avatarUrl ? (
                            <Image
                                src={profile.avatarUrl}
                                alt="Avatar"
                                fill
                                unoptimized
                                className={`object-cover ${isOwnProfile ? 'transition-opacity group-hover:opacity-80' : ''}`}
                            />
                        ) : (
                            <span className={`text-4xl text-primary font-bold ${isOwnProfile ? 'transition-opacity group-hover:opacity-80' : ''}`}>
                                {profile.fullName ? profile.fullName.charAt(0) : "U"}
                            </span>
                        )}
                        {isOwnProfile && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </div>

                    {isOwnProfile && (
                        <div className="mb-2">
                            <Button variant="outline" size="lg" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
                        </div>
                    )}
                </div>
            </div>

            {isOwnProfile && (
                <>
                    <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        currentProfile={profile}
                    />

                    <ProfileMediaUploadModal
                        isOpen={isAvatarModalOpen}
                        onClose={() => setIsAvatarModalOpen(false)}
                        profileId={profile.id}
                        mediaType={ProfileMediaType.Avatar}
                    />

                    <ProfileMediaUploadModal
                        isOpen={isBackgroundModalOpen}
                        onClose={() => setIsBackgroundModalOpen(false)}
                        profileId={profile.id}
                        mediaType={ProfileMediaType.Background}
                    />
                </>
            )}
        </>
    );
}
