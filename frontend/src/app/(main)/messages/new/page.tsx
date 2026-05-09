"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, UserX } from "lucide-react";
import { InitiateChatPanel } from "./_component/initiate-chat-panel";
import { useProfileById } from "@/features/messages/hooks/chats/use-profile-by-id";

function NewChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const profileId = searchParams.get("profileId");

    const { data: profile, isLoading } = useProfileById(profileId);

    if (!profileId) {
        router.replace("/messages");
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                    <UserX className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-foreground">User not found</p>
                    <p className="mt-1 text-sm">This profile may no longer exist.</p>
                </div>
                <button
                    onClick={() => router.push("/messages")}
                    className="mt-2 text-sm text-primary hover:underline"
                >
                    Back to messages
                </button>
            </div>
        );
    }

    return <InitiateChatPanel targetProfile={profile} />;
}

export default function NewChatPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <NewChatContent />
        </Suspense>
    );
}
