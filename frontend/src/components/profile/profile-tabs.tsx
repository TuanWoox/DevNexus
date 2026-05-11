"use client";

interface ProfileTabsProps {
    activeTab: "overview" | "post" | "qa-post" | "saved";
    setActiveTab: (tab: "overview" | "post" | "qa-post" | "saved") => void;
    isOwnProfile: boolean;
    isPrivate: boolean;
}

export function ProfileTabs({ activeTab, setActiveTab, isOwnProfile, isPrivate }: ProfileTabsProps) {
    const allTabs = [
        { id: "overview", label: "Overview" },
        { id: "post", label: "Posts" },
        { id: "qa-post", label: "Q&A" },
        { id: "saved", label: "Saved" },
    ];

    const isPrivateAndNotOwner = !isOwnProfile && isPrivate;

    const tabs = allTabs.filter(tab => {
        if (tab.id === 'saved' && !isOwnProfile) return false;
        if (isPrivateAndNotOwner) {
            return tab.id === 'overview';
        }
        return true;
    });

    return (
        <div className="px-4 md:px-10 max-w-5xl mx-auto w-full">
            <nav className="flex gap-1 overflow-x-auto no-scrollbar border-t border-gray-300 dark:border-gray-700" aria-label="Profile tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as "overview" | "post" | "qa-post" | "saved")}
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
