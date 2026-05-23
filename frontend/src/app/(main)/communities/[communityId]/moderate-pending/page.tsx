"use client";

import { useParams } from "next/navigation";
import { PendingWorkspace } from "@/components/communities/pending/pending-workspace";
import { useGetPendingPosts } from "@/hooks/post-hooks/use-get-pending-posts";
import { useGetPendingQAPosts } from "@/hooks/qa-post-hooks/use-get-pending-qa-posts";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ModeratePendingPostsPage() {
    const params = useParams<{ communityId: string }>();
    const communityId = params.communityId;
    const { data: pendingPosts, isLoading: postsLoading } = useGetPendingPosts(communityId);
    const { data: pendingQAPosts, isLoading: qaLoading } = useGetPendingQAPosts(communityId);

    const posts = pendingPosts?.data ?? [];
    const questions = pendingQAPosts?.data ?? [];
    const isLoading = postsLoading || qaLoading;

    return (
        <div className="w-full max-w-[1600px] mx-auto h-[calc(100dvh-5rem)] sm:h-[100dvh] flex flex-col py-6 px-4 sm:px-6 lg:px-8 overflow-hidden gap-4">
            <div className="shrink-0 space-y-3 px-2">
                <Link
                    href={`/communities/${communityId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                >
                    <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Community
                </Link>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-heading">
                        Moderate Pending Content
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review and verify community submissions, read detailed text inline, and manage approvals.
                    </p>
                </div>
            </div>
            
            <div className="flex-1 min-h-0 w-full">
                <PendingWorkspace
                    posts={posts}
                    questions={questions}
                    isModerator
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
