'use client';

import { useRouter } from 'next/navigation';
import { UserX, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileNotFound() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center fade-in">
            {/* Animated Icon Container */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                    <UserX className="w-12 h-12 md:w-16 md:h-16 text-primary animate-bounce-subtle" />
                </div>
            </div>

            {/* Text Content */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-heading mb-4">
                Profile Not Found
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-10 text-base md:text-lg leading-relaxed">
                We couldn't find the profile you're looking for. It might have been removed, or the link is incorrect.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Button
                    variant="custom"
                    size="lg"
                    onClick={() => router.back()}
                    className="btn-secondary w-full sm:w-auto px-8 gap-2 font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </Button>

                <Button
                    size="lg"
                    onClick={() => window.location.reload()}
                    className="btn-ai text-white w-full sm:w-auto px-8 gap-2 font-semibold"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </Button>

                <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => router.push('/feed')}
                    className="w-full sm:w-auto px-8 gap-2 font-medium hover:bg-subtle"
                >
                    <Home className="w-4 h-4" />
                    Home Page
                </Button>
            </div>

            {/* Decorative element */}
            <div className="mt-16 text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-50">
                DevNexus Intelligence System
            </div>
        </div>
    );
}
