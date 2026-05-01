"use client";

import { InboxTab } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";

interface MessageTabsProps {
    activeTab: InboxTab;
    onTabChange: (tab: InboxTab) => void;
}

const tabs: Array<{ id: InboxTab; label: string }> = [
    { id: "main", label: "Primary" },
    { id: "request", label: "Requests" },
    { id: "archived", label: "Archived" },
];

export function MessageTabs({ activeTab, onTabChange }: MessageTabsProps) {
    return (
        <nav className="flex gap-0.5 p-0.5 rounded-md bg-muted/50" aria-label="Message tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "relative flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer",
                        activeTab === tab.id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-primary" />
                    )}
                </button>
            ))}
        </nav>
    );
}
