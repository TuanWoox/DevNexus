"use client";

import { SelectProfileDTO } from "@/types/profile/select-profile-dto";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Lock, Star, UserPlus, MessageSquare, MoreHorizontal, Share2, ShieldAlert, UserX, Edit3 } from "lucide-react";

interface ProfileInfoProps {
    profile: SelectProfileDTO;
    isOwnProfile: boolean;
    onEdit?: () => void;
}

export function ProfileInfo({ profile, isOwnProfile, onEdit }: ProfileInfoProps) {
    return (
        <div className="px-4 md:px-10 max-w-5xl mx-auto w-full pb-6">
            {/* Name + private badge + options menu */}
            <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {profile.fullName || "User Name"}
                </h1>
                
                {!isOwnProfile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground border shadow-sm">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem className="cursor-pointer">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Report User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <UserX className="w-4 h-4 mr-2" />
                                Block User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {profile.isPrivate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium ml-2">
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

            {/* Tech stack tags - Ensuring they display */}
            {profile.techStacks && profile.techStacks.length > 0 ? (
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
            ) : isOwnProfile && (
                <p className="mt-4 text-xs text-muted-foreground italic">No tech stacks added yet. Edit your profile to showcase your skills.</p>
            )}

            {/* Actions Row - Positioned "under the tags" */}
            <div className="flex items-center gap-2 mt-6">
                {isOwnProfile ? (
                    <Button 
                        onClick={onEdit}
                        variant="secondary" 
                        size="default" 
                        className="h-10 font-semibold px-8 border shadow-sm"
                    >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                ) : (
                    <>
                        <Button size="default" className="h-10 font-semibold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                        </Button>
                        <Button variant="secondary" size="default" className="h-10 font-semibold px-8 border shadow-sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}


