"use client";

type CommunityTab = "posts" | "qa" | "members";

interface CommunityTabsProps {
    activeTab: CommunityTab;
    setActiveTab: (tab: CommunityTab) => void;
}

const TABS: { id: CommunityTab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "qa", label: "Q&A" },
    { id: "members", label: "Members" },
];

export function CommunityTabs({ activeTab, setActiveTab }: CommunityTabsProps) {
    return (
        <div className="px-4 md:px-6 max-w-6xl mx-auto w-full">
            <nav
                className="flex gap-1 overflow-x-auto no-scrollbar border-t border-gray-300 dark:border-gray-700"
                aria-label="Community tabs"
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
