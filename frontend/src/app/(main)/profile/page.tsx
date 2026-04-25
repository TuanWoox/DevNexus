"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (user?.profileId) {
            router.replace(`/profile/${user.profileId}`);
        }
    }, [user, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Redirecting to your profile...</p>
        </div>
    );
}