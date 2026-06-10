"use client";

import { useAuthTokenResult } from "@/hooks/auth-hooks/use-auth-token-result";
import { accountService } from "@/services/account-service";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

function GithubCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { handleAuthTokenResult } = useAuthTokenResult();

    const { mutate } = useMutation({
        mutationFn: (payload: { code: string; redirectUri: string }) => accountService.githubLogin(payload),
        onSuccess: (data) => handleAuthTokenResult(data, "Signed in with GitHub."),
        onError: () => {
            toast.error("GitHub login failed.");
            router.push("/login");
        }
    });

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const storedState = sessionStorage.getItem("github_oauth_state");
        const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;

        sessionStorage.removeItem("github_oauth_state");

        if (!code || !state || !storedState || state !== storedState || !redirectUri) {
            toast.error("Invalid GitHub login callback.");
            router.push("/login");
            return;
        }

        mutate({ code, redirectUri });
    }, [mutate, router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
            Signing in with GitHub...
        </div>
    );
}

export default function GithubCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                Signing in with GitHub...
            </div>
        }>
            <GithubCallbackContent />
        </Suspense>
    );
}
