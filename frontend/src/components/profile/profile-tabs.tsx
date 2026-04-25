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
        { id: "post", label: "Post" },
        { id: "qa-post", label: "QA Post" },
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
        <div className="px-4 md:px-8 max-w-5xl mx-auto w-full mt-4 border-b">
            <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`border-b-2 py-4 px-1 text-base font-semibold cursor-pointer whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
