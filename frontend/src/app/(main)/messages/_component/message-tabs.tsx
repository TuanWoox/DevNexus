"use client";

import { InboxTab } from "@/features/messages/hooks/use-messaging";
import { cn } from "@/lib/utils";

interface MessageTabsProps {
    activeTab: InboxTab;
    onTabChange: (tab: InboxTab) => void;
    counts: Record<InboxTab, number>;
}

const tabs: Array<{ id: InboxTab; label: string }> = [
    { id: "main", label: "Primary" },
    { id: "request", label: "Requests" },
    { id: "archived", label: "Archived" },
];

export function MessageTabs({ activeTab, onTabChange, counts }: MessageTabsProps) {
    return (
        <nav className="flex gap-1" aria-label="Message tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                        activeTab === tab.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                >
                    {tab.label}
                    {counts[tab.id] > 0 && (
                        <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {counts[tab.id]}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
}
