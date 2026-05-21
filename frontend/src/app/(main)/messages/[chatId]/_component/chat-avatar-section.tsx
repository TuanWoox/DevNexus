"use client";

import { useRef, useState } from "react";
import { Users, Camera, Pencil, Check, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import { Chat } from "@/features/messages/types/contracts";
import { getAvatarUrl, getTitle } from "@/features/messages/utils/message-service.helper";
import { useUploadGroupPicture } from "@/features/messages/hooks/groups/use-upload-group-picture";
import { useUpdateGroup } from "@/features/messages/hooks/groups/use-update-group";
import { cn } from "@/lib/utils";

interface ChatAvatarSectionProps {
    chat: Chat;
    currentProfileId: string;
}

export function ChatAvatarSection({ chat, currentProfileId }: ChatAvatarSectionProps) {
    const title = getTitle(chat, currentProfileId);
    const rawAvatarUrl = getAvatarUrl(chat, currentProfileId);
    // getAvatarUrl already applies getMediaUrl() for group pictures
    const fullAvatarUrl = rawAvatarUrl || undefined;
    const memberCount = chat.Members?.length ?? 0;
    const isRequest = chat?.ChatSettings?.find(
        (s) => s.ProfileId === currentProfileId
    )?.IsRequested ?? chat?.ChatSettings?.[0]?.IsRequested;

    const isAdmin = chat.IsGroup && chat.ChatSettings?.find(
        (s) => s.ProfileId === currentProfileId
    )?.Role === "ADMIN";

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadPicture = useUploadGroupPicture(chat.Id);
    const updateGroup = useUpdateGroup(chat.Id);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(chat.Name || "");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadPicture.mutate(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSaveName = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== chat.Name) {
            updateGroup.mutate({ Name: trimmed });
        }
        setIsEditingName(false);
    };

    const handleCancelName = () => {
        setEditName(chat.Name || "");
        setIsEditingName(false);
    };

    return (
        <div className="flex flex-col items-center gap-3 py-6 px-4">
            <div className="relative shrink-0">
                <button
                    type="button"
                    className={cn(
                        "relative",
                        isAdmin && "cursor-pointer group",
                        !isAdmin && "cursor-default",
                    )}
                    onClick={() => isAdmin && fileInputRef.current?.click()}
                    disabled={!isAdmin}
                    aria-label={isAdmin ? "Change group picture" : undefined}
                >
                    <UserAvatar avatarUrl={fullAvatarUrl} fullName={title} className="h-24 w-24 ring-4 ring-border/30 shadow-card" />
                    {isAdmin && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    )}
                </button>
                {isAdmin && (
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                )}
                <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card",
                    isRequest ? "bg-amber-400" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                )} />
            </div>

            <div className="text-center w-full">
                {chat.IsGroup && isAdmin && isEditingName ? (
                    <div className="flex items-center gap-1 justify-center">
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm font-bold text-center w-48"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveName();
                                if (e.key === "Escape") handleCancelName();
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleSaveName}
                            className="rounded-full p-1 text-emerald-500 hover:bg-emerald-500/10"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelName}
                            className="rounded-full p-1 text-muted-foreground hover:bg-accent"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1.5">
                        <p className="text-base font-bold text-foreground tracking-tight">{title}</p>
                        {chat.IsGroup && isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditName(chat.Name || "");
                                    setIsEditingName(true);
                                }}
                                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                aria-label="Edit group name"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                    {chat.IsGroup ? (
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </span>
                    ) : isRequest ? (
                        "Message request"
                    ) : (
                        "Active now"
                    )}
                </p>
            </div>
        </div>
    );
}
