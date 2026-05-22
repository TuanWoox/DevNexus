"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownViewer } from "@/components/editor/markdown-viewer";

interface PendingPostContentProps {
    content: string;
    tagNames?: string[];
    postId?: string;
}

export function PendingPostContent({ content, tagNames = [], postId }: PendingPostContentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check if the content is long enough to warrant a collapse/expand feature
    const isLongContent = content.length > 300 || content.split("\n").length > 5;

    return (
        <div className="space-y-4">
            <div className="relative">
                <div
                    className={cn(
                        "text-body text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-all select-text overflow-hidden",
                        !isExpanded && isLongContent ? "max-h-[220px]" : "max-h-none"
                    )}
                >
                    <MarkdownViewer 
                        source={content} 
                        enableCodeTools={true}
                        context="post-detail"
                        postId={postId}
                    />
                </div>
                
                {/* Fade effect at the bottom when collapsed */}
                {!isExpanded && isLongContent && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
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
