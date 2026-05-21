"use client";

import Link from "next/link";
import { ArrowBigUp, FileText, HelpCircle, Lock, MessageSquare, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownViewer } from "@/components/editor/markdown-viewer";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";
import {
  SearchCommunityResult,
  SearchProfileResult,
} from "@/types/search/global-search-result";
import { SelectPostAuthorDTO, SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

function toHoverAuthor(author: SelectPostAuthorDTO) {
  return {
    fullName: author.fullName,
    avatarUrl: author.avatarUrl ?? undefined,
    backgroundUrl: author.backgroundUrl ?? undefined,
    bio: author.bio ?? undefined,
    reputationPoints: author.reputationPoints,
    techStacks: author.techStacks,
    isPrivate: author.isPrivate,
  };
}

function profileToHoverAuthor(profile: SearchProfileResult) {
  return {
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? undefined,
    bio: profile.bio ?? undefined,
    reputationPoints: profile.reputationPoints,
    techStacks: profile.techStacks ?? [],
    isPrivate: profile.isPrivate,
  };
}

export function SearchPostCard({ post, question = false }: { post: SelectPostDTO | SelectQAPostDTO; question?: boolean }) {
  const href = `${question ? "/questions" : "/post"}/${post.id}`;
  const Icon = question ? HelpCircle : FileText;
  const answerOrCommentCount = question ? (post as SelectQAPostDTO).answerCount : post.commentCount;
  const formattedDate = post.dateCreated
    ? new Date(post.dateCreated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Card className="group border-default bg-card/95 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
              <Icon className="size-3.5" />
              {question ? "Question" : "Post"}
            </Badge>
            {post.community?.name && (
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                in <span className="font-medium text-heading">{post.community.name}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowBigUp className="size-4 text-emerald-500" />
              {post.upvoteCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5 text-primary" />
              {answerOrCommentCount}
            </span>
          </div>
        </div>

        <Link href={href} className="block">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-heading transition-colors group-hover:text-primary sm:text-xl">
            {post.title}
          </h2>
        </Link>
        <div className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          <MarkdownViewer source={post.content} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          {post.author ? (
            <ProfileHoverCard profileId={post.authorId} author={toHoverAuthor(post.author)}>
              <Link href={`/profile/${post.authorId}`} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <UserAvatar avatarUrl={post.author.avatarUrl} fullName={post.author.fullName} size="sm" />
                <span className="truncate font-medium">{post.author.fullName}</span>
              </Link>
            </ProfileHoverCard>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown author</span>
          )}
          {formattedDate && <span className="text-xs text-muted-foreground">{formattedDate}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchCommunityCard({ community }: { community: SearchCommunityResult }) {
  return (
    <Card className="group border-default bg-card/95 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated">
      <Link href={`/communities/${community.id}`} className="flex gap-3 p-4 sm:p-5">
        <Avatar className="size-12 rounded-lg ring-1 ring-border" size="lg">
          <AvatarImage src={community.communityCoverPhotoUrl ?? undefined} className="rounded-lg" />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary"><Users className="size-5" /></AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-heading transition-colors group-hover:text-primary">{community.name}</h2>
            {community.isPrivate && (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" />
                Private
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{community.description || "No description"}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5 text-primary" />
            <span>{community.memberCount} members</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

export function SearchProfileCard({ profile }: { profile: SearchProfileResult }) {
  return (
    <ProfileHoverCard profileId={profile.id} author={profileToHoverAuthor(profile)} side="top">
      <Card className="group border-default bg-card/95 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated">
        <Link href={`/profile/${profile.id}`} className="flex gap-3 p-4 sm:p-5">
          <UserAvatar avatarUrl={profile.avatarUrl} fullName={profile.fullName} className="size-12 ring-1 ring-border" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-heading transition-colors group-hover:text-primary">{profile.fullName}</h2>
              {profile.isPrivate && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="size-3" />
                  Private
                </Badge>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{profile.bio || "No bio yet"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Star className="size-3.5 fill-current" />
                {profile.reputationPoints} reputation
              </span>
              {profile.techStacks?.slice(0, 3).map((stack) => (
                <Badge key={stack} variant="secondary" className="max-w-28 truncate">
                  {stack}
                </Badge>
              ))}
            </div>
          </div>
        </Link>
      </Card>
    </ProfileHoverCard>
  );
}
