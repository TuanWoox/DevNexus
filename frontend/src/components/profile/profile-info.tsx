"use client";

import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { Lock } from "lucide-react";

interface ProfileInfoProps {
    profile: SelectProfileDTO;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
    return (
        <div className="px-4 md:px-8 max-w-5xl mx-auto w-full ">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                {profile.fullName || "User Name"}
                {profile.isPrivate && (
                    <div className="p-1.5 bg-muted rounded-full inline-flex" title="Private Profile">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}
            </h1>
            {profile.techStacks && profile.techStacks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {profile.techStacks.map((tech) => (
                        <span key={tech} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium">
                            {tech}
                        </span>
                    ))}
                </div>
            )}
            <p className="mt-4 text-sm md:text-base max-w-2xl">{profile.bio || "No bio added yet."}</p>

            <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-1 cursor-pointer hover:underline">
                    <span className="font-bold text-primary">{profile.reputationPoints || 0}</span>
                    <span className="text-muted-foreground">Reputation</span>
                </div>
            </div>
        </div>
    );
}
