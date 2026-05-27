"use client";

import { useState } from "react";
import { Ban, KeyRound, Settings } from "lucide-react";

import { SecuritySettingsSection } from "@/components/settings/security-settings-section";
import { PrivacySafetySettingsSection } from "@/components/settings/privacy-safety-settings-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SettingsSection = "security" | "privacy-safety";

const sections = [
    {
        value: "security" as const,
        label: "Security",
        description: "Password and account access",
        icon: KeyRound,
    },
    {
        value: "privacy-safety" as const,
        label: "Privacy & Safety",
        description: "Blocked profiles and safety controls",
        icon: Ban,
    },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SettingsSection>("security");
    const activeConfig = sections.find((section) => section.value === activeSection) ?? sections[0];
    const ActiveIcon = activeConfig.icon;

    return (
        <div className="min-h-dvh bg-page pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
                <div className="flex items-center gap-4 border-b border-border/30">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Settings className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            Settings
                        </h1>
                        <p className="text-base text-muted-foreground mt-1">
                            Manage your account security, privacy, and user preferences.
                        </p>
                    </div>
                </div>

                <div className="bg-card border-2 border-border rounded-2xl shadow-2xl flex flex-col lg:flex-row min-h-[calc(100dvh-240px)] transition-all duration-300 w-full lg:min-w-[960px] lg:max-w-6xl mx-auto overflow-hidden">
                    <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-muted/40 p-7 flex-col gap-2">
                        <div className="pb-4 mb-2 border-b border-border/40">
                            <h2 className="text-base font-bold text-muted-foreground uppercase tracking-wider">
                                Settings Menu
                            </h2>
                            <p className="text-sm text-muted-foreground/80 mt-0.5">
                                Configure your account
                            </p>
                        </div>

                        <nav className="flex flex-col gap-1.5">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.value;

                                return (
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => setActiveSection(section.value)}
                                        className={cn(
                                            "w-full shrink-0 flex items-center gap-3 justify-start px-4 py-3 text-left font-semibold rounded-xl transition-all duration-200 ease-out border text-base whitespace-nowrap cursor-pointer active:scale-[0.98]",
                                            isActive
                                                ? section.value === "privacy-safety"
                                                    ? "bg-red-500/10 text-red-600 border-red-500/10"
                                                    : "bg-primary/10 text-primary border-primary/10"
                                                : section.value === "privacy-safety"
                                                    ? "border-transparent text-muted-foreground hover:bg-red-500/5 hover:text-red-600"
                                                    : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{section.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 relative">
                        <div className="block lg:hidden w-full mb-6">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                Settings Section
                            </label>
                            <Select
                                value={activeSection}
                                onValueChange={(value) => setActiveSection(value as SettingsSection)}
                            >
                                <SelectTrigger className="w-full h-11 rounded-xl border border-border bg-background px-3 shadow-sm focus:ring-primary/20 cursor-pointer">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                                    {sections.map((section) => (
                                        <SelectItem
                                            key={section.value}
                                            value={section.value}
                                            className={cn(
                                                "flex items-center text-sm font-semibold gap-3 p-2.5 hover:bg-subtle text-body hover:text-heading transition-colors cursor-pointer",
                                                section.value === "privacy-safety" && "text-red-600 focus:text-red-600 focus:bg-red-500/5"
                                            )}
                                        >
                                            {section.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mb-6 border-b border-border/30 pb-4">
                            <h2
                                className={cn(
                                    "text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2",
                                    activeSection === "privacy-safety" && "text-red-600"
                                )}
                            >
                                <ActiveIcon className="h-5 w-5" />
                                {activeConfig.label}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeConfig.description}
                            </p>
                        </div>

                        {activeSection === "security" ? (
                            <SecuritySettingsSection />
                        ) : (
                            <PrivacySafetySettingsSection />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
