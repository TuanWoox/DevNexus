"use client";

import Link from "next/link";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";
import { ProfileSummaryDTO } from "@/types/admin/admin-report-dto";

interface AdminReportProfileHoverCardProps {
  profile?: ProfileSummaryDTO | null;
  fallbackId?: string | null;
}

function displayName(profile?: ProfileSummaryDTO | null, fallbackId?: string | null) {
  return profile?.displayName || fallbackId || "—";
}

export function AdminReportProfileHoverCard({ profile, fallbackId }: AdminReportProfileHoverCardProps) {
  const name = displayName(profile, fallbackId);

  if (!profile?.id) {
    return <span className="font-mono text-muted-foreground">@{name}</span>;
  }

  return (
    <ProfileHoverCard
      profileId={profile.id}
      author={{
        fullName: profile.displayName,
        avatarUrl: profile.avatarUrl ?? undefined,
        bio: profile.role ? profile.role : undefined,
      }}
      side="top"
      variant="admin"
      showMessageAction={false}
      showBlockAction={false}
      showProfileAction
    >
      <Link
        href={`/profile/${profile.id}`}
        className="inline-flex max-w-full font-mono text-body hover:text-primary hover:underline"
      >
        <span className="truncate">@{name}</span>
      </Link>
    </ProfileHoverCard>
  );
}
