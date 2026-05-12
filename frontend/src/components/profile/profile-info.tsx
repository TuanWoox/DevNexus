"use client";

import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { Lock, Star } from "lucide-react";

interface ProfileInfoProps {
    profile: SelectProfileDTO;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
    return (
        <div className="px-4 md:px-10 max-w-5xl mx-auto w-full pb-6">
            {/* Name + private badge */}
            <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {profile.fullName || "User Name"}
                </h1>
                {profile.isPrivate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Private
                    </span>
                )}
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                    {profile.bio}
                </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-heading">{profile.reputationPoints || 0}</span>
                    <span className="text-muted-foreground">reputation</span>
                </div>
            </div>

            {/* Tech stack tags */}
            {profile.techStacks && profile.techStacks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {profile.techStacks.map((tech) => (
                        <span
                            key={tech}
                            className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium border border-primary/20 hover:bg-primary/20 transition-colors cursor-default"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
