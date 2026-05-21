"use client";

import { FileX, ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PostNotFoundProps {
    isForbidden?: boolean;
    message?: string;
}

export default function PostNotFound({ isForbidden = false, message }: PostNotFoundProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center">
            {/* Animated Icon Container */}
            <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-destructive/10 opacity-75 duration-1000 size-20 sm:size-24" />
                <div className="relative flex items-center justify-center rounded-full bg-destructive/10 p-6 text-destructive size-20 sm:size-24 border border-destructive/20 shadow-inner">
                    {isForbidden ? (
                        <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
                    ) : (
                        <FileX className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
                    )}
                </div>
            </div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight max-w-md">
                {isForbidden ? "Access Restricted" : "Post Not Found"}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
                {message || (isForbidden
                    ? "You don't have permission to view this content. It might be private or restricted to specific community members."
                    : "The post you are looking for doesn't exist, has been deleted, or is currently undergoing moderation.")}
            </p>

            {/* Premium Button Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center justify-center gap-2 h-11 px-6 font-semibold shadow-sm hover:bg-muted border cursor-pointer w-full sm:w-auto"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => router.push("/feed")}
                    className="flex items-center justify-center gap-2 h-11 px-6 font-semibold shadow-sm cursor-pointer w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <Home className="h-4 w-4" />
                    Go Home
                </Button>
            </div>
        </div>
    );
}
