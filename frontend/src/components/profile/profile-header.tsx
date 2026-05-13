"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon } from "lucide-react";
import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { ProfileMediaType } from "@/types/profile-media/profile-media-type";
import { ProfileMediaUploadModal } from "@/components/profile/avatar-upload-modal";

interface ProfileHeaderProps {
    profile: SelectProfileDTO;
    isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

    return (
        <>
            {/* Background / Cover Image */}
            <div
                className={`w-full h-52 md:h-72 relative bg-linear-to-br from-primary/30 via-primary/10 to-transparent ${isOwnProfile ? 'group cursor-pointer' : ''}`}
                onClick={() => { if (isOwnProfile) setIsBackgroundModalOpen(true) }}
            >
                <Image
                    src={profile.backgroundUrl || "/images/default-background.webp"}
                    alt="Cover Image"
                    fill
                    priority
                    unoptimized
                    className={`object-cover ${isOwnProfile ? 'transition-opacity group-hover:opacity-80' : ''}`}
                />
                {/* Bottom gradient overlay for depth */}
                <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

                {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-center text-white">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-sm">Update Cover Photo</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar + Actions Row */}
            <div className="px-4 md:px-10 max-w-5xl mx-auto w-full">
                <div className="relative flex justify-between items-end -mt-16 md:-mt-20 pb-4">
                    {/* Avatar */}
                    <div
                        className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center shadow-xl ring-2 ring-white/10 dark:ring-black/30 ${isOwnProfile ? 'cursor-pointer group hover:scale-[1.02] transition-transform' : ''}`}
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
                            <span className={`text-5xl text-primary font-bold ${isOwnProfile ? 'transition-opacity group-hover:opacity-80' : ''}`}>
                                {profile.fullName ? profile.fullName.charAt(0) : "U"}
                            </span>
                        )}
                        {isOwnProfile && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <>
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



