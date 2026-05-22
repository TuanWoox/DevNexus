"use client";

import { Calendar, FileText, HelpCircle } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { cn } from "@/lib/utils";

interface PendingListItemProps {
    item: SelectPostDTO;
    isActive: boolean;
    onClick: () => void;
    isQuestion?: boolean;
}

export function PendingListItem({ item, isActive, onClick, isQuestion = false }: PendingListItemProps) {
    const authorName = item.author?.fullName ?? "Anonymous";
    const dateFormatted = new Date(item.dateCreated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left flex items-start gap-3 p-3.5 transition-all duration-200 select-none border-b border-border/40",
                "focus-visible:outline-none focus-visible:bg-muted",
                isActive
                    ? isQuestion
                        ? "bg-cyan-500/5 dark:bg-cyan-500/10 border-l-4 border-l-cyan-500 font-medium"
                        : "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary font-medium"
                    : "border-l-4 border-l-transparent hover:bg-muted/40"
            )}
        >
            <UserAvatar 
                avatarUrl={item.author?.avatarUrl} 
                fullName={authorName} 
                className="size-8.5 shrink-0 border border-border/40" 
            />
            
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 shrink-0">
                        {isQuestion ? (
                            <span className="badge-cyan text-2xs py-0 px-1.5 h-4.5 gap-0.5 rounded-sm">
                                <HelpCircle className="size-2.5" />
                                Q&A
                            </span>
                        ) : (
                            <span className="badge-default text-2xs py-0 px-1.5 h-4.5 gap-0.5 rounded-sm">
                                <FileText className="size-2.5" />
                                Post
                            </span>
                        )}
                    </span>
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground font-mono">
                        <Calendar className="size-2.5" />
                        {dateFormatted}
                    </span>
                </div>

                <h4
                    className={cn(
                        "text-sm tracking-tight text-heading leading-tight truncate",
                        isActive ? "font-semibold text-foreground" : "text-foreground/80"
                    )}
                >
                    {item.title}
                </h4>
                
                <p className="text-2xs text-muted-foreground truncate">
                    by <span className="font-medium text-muted-foreground/80">{authorName}</span>
                </p>
            </div>
        </button>
    );
}
