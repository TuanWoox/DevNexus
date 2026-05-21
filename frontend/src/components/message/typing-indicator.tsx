"use client";

import { useTypingUsers } from "@/features/messages/hooks/messages/use-typing-users";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

interface Props {
    chatId: string;
    isGroup: boolean;
}

export function TypingIndicator({ chatId, isGroup }: Props) {
    const typingUsers = useTypingUsers(chatId);
    if (!typingUsers.length) return null;

    const visible = isGroup ? typingUsers.slice(0, MAX_VISIBLE) : typingUsers.slice(0, 1);
    const overflow = isGroup ? typingUsers.length - MAX_VISIBLE : 0;

    return (
        <TooltipProvider delayDuration={200}>
            <div className={cn(
                "flex items-center gap-2.5 px-2 py-2 mb-2",
                "animate-in fade-in slide-in-from-bottom-1 duration-200"
            )}>
                <div className="flex -space-x-2">
                    {visible.map(u => (
                        <Tooltip key={u.profileId}>
                            <TooltipTrigger asChild>
                                <UserAvatar
                                    avatarUrl={u.AvatarUrl}
                                    fullName={u.FullName}
                                    className="h-7 w-7 ring-2 ring-background cursor-default"
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                {u.FullName}
                            </TooltipContent>
                        </Tooltip>
                    ))}

                    {isGroup && overflow > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="h-7 w-7 rounded-full ring-2 ring-background bg-muted flex items-center justify-center cursor-default">
                                    <span className="text-[9px] font-medium text-muted-foreground">
                                        +{overflow}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                {typingUsers.slice(MAX_VISIBLE).map(u => u.FullName).join(", ")}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </TooltipProvider>
    );
}
