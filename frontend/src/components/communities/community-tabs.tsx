"use client";

import { CommunityFetchMode } from "@/constants/communityFetchMode";

interface CommunityTabsProps {
    activeTab: CommunityFetchMode;
    setActiveTab: (tab: CommunityFetchMode) => void;
}

export function CommunityTabs({ activeTab, setActiveTab }: CommunityTabsProps) {
    const tabs = [
        { id: CommunityFetchMode.EXPLORE, label: "Discover" },
        { id: CommunityFetchMode.YOURS, label: "Your Communities" },
    ];

    return (
        <div className="max-w-7xl mx-auto w-full">
            <nav className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-300 dark:border-gray-700" aria-label="Community tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as CommunityFetchMode)}
                        className={`
                            relative mt-1 px-4 py-3 text-base font-semibold whitespace-nowrap
                            cursor-pointer transition-colors duration-150 rounded-t-md
                            ${activeTab === tab.id
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-heading hover:bg-muted/50"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
