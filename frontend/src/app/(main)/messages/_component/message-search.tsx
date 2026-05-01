"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function MessageSearch({ value, onChange }: MessageSearchProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search conversations..."
                className={cn(
                    "w-full rounded-xl bg-muted/60 py-2 pl-9 pr-8",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "outline-none ring-0 border-0",
                    "focus:bg-muted focus:ring-1 focus:ring-primary/20",
                    "transition-colors",
                )}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
