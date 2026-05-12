import { Metadata } from "next";
import { CommunitiesList } from "@/components/communities/communities-list";

export const metadata: Metadata = {
    title: 'Explore Communities | DevNexus',
    description: 'Discover and join engineering communities on DevNexus. Find your next learning group, project team, or discussion hub.',
};

export default function CommunitiesPage() {
    return (
        <div className="w-full min-h-screen bg-background overflow-hidden">
            <div className="relative z-10 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto mb-6 fade-in relative">
                    <div className="absolute -inset-1 bg-linear-to-r from-primary to-primary/60 blur-2xl opacity-20 dark:opacity-10 rounded-full animate-pulse-slow -z-10" />
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                        Explore <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">Communities</span>
                    </h1>
                    <p className="text-base text-muted-foreground max-w-2xl">
                        Find your tribe. Discover communities built for engineers by engineers to learn, share, and grow together.
                    </p>
                </div>

                <CommunitiesList />
            </div>
        </div>
    );
}