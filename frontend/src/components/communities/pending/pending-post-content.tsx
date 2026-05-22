"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PendingPostContentProps {
    content: string;
    tagNames?: string[];
}

export function PendingPostContent({ content, tagNames = [] }: PendingPostContentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check if the content is long enough to warrant a collapse/expand feature
    const isLongContent = content.length > 300 || content.split("\n").length > 5;

    return (
        <div className="space-y-4">
            <div className="relative">
                <p
                    className={cn(
                        "text-sm text-body leading-relaxed whitespace-pre-wrap transition-all duration-200 select-text",
                        !isExpanded && isLongContent && "line-clamp-5"
                    )}
                >
                    {content}
                </p>
                
                {/* Fade effect at the bottom when collapsed */}
                {!isExpanded && isLongContent && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                )}
            </div>

            {isLongContent && (
                <div className="flex justify-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-primary hover:text-primary-foreground hover:bg-primary font-semibold flex items-center gap-1 h-7 px-3 rounded-md transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <span>Collapse content</span>
                                <ChevronUp className="h-3 w-3" />
                            </>
                        ) : (
                            <>
                                <span>Read full content</span>
                                <ChevronDown className="h-3 w-3" />
                            </>
                        )}
                    </Button>
                </div>
            )}

            {tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-border/20 pt-3">
                    {tagNames.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 text-2xs px-2 py-0.5 rounded-md border border-border/30 transition-all font-mono"
                        >
                            #{tag}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
