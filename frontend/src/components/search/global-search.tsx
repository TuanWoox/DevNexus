"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, HelpCircle, Loader2, Search, Users, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { useGlobalSearch } from "@/hooks/search-hooks/use-global-search";
import { cn } from "@/lib/utils";
import {
  SearchCommunityResult,
  SearchProfileResult,
} from "@/types/search/global-search-result";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

const DEFAULT_AVATAR_URL = "/images/default-avatar.webp";

type GlobalSearchProps = {
  trigger?: ReactNode;
  compact?: boolean;
};

function initials(value?: string | null) {
  return value?.trim().charAt(0).toUpperCase() || "D";
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <div className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function GlobalSearch({ trigger, compact = false }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useGlobalSearch(debouncedQuery);

  const hasResults = useMemo(() => {
    if (!data) return false;
    return data.posts.length + data.qaPosts.length + data.communities.length + data.profiles.length > 0;
  }, [data]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    goTo(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function ResultButton({ children, href }: { children: ReactNode; href: string }) {
    return (
      <button
        type="button"
        onClick={() => goTo(href)}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-subtle"
      >
        {children}
      </button>
    );
  }

  function PostRow({ post, question = false }: { post: SelectPostDTO | SelectQAPostDTO; question?: boolean }) {
    const Icon = question ? HelpCircle : FileText;
    return (
      <ResultButton href={`${question ? "/questions" : "/post"}/${post.id}`}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-heading">{post.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {post.author?.fullName || "Unknown"}{post?.community?.name ? ` in ${post.community.name}` : ""}
          </div>
        </div>
      </ResultButton>
    );
  }

  function CommunityRow({ community }: { community: SearchCommunityResult }) {
    return (
      <ResultButton href={`/communities/${community.id}`}>
        <Avatar className="rounded-md" size="lg">
          <AvatarImage src={community.communityCoverPhotoUrl ?? undefined} className="rounded-md" />
          <AvatarFallback className="rounded-md"><Users className="size-4" /></AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-heading">{community.name}</div>
          <div className="truncate text-xs text-muted-foreground">{community.memberCount} members</div>
        </div>
      </ResultButton>
    );
  }

  function ProfileRow({ profile }: { profile: SearchProfileResult }) {
    return (
      <ResultButton href={`/profile/${profile.id}`}>
        <Avatar size="lg">
          <AvatarImage src={profile.avatarUrl || DEFAULT_AVATAR_URL} />
          <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-heading">{profile.fullName}</div>
          <div className="truncate text-xs text-muted-foreground">{profile.reputationPoints} reputation</div>
        </div>
      </ResultButton>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-lg border border-default bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-subtle",
              compact ? "w-full justify-center" : "w-full justify-between"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search className="size-4" />
              {!compact && <span className="truncate">Search DevNexus</span>}
            </span>
            {!compact && <kbd className="rounded border border-default px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="top-4 max-h-[calc(100vh-2rem)] translate-y-0 overflow-hidden p-0 sm:top-[12vh] sm:max-w-2xl sm:translate-y-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Search DevNexus</DialogTitle>
        <form onSubmit={submit} className="flex items-center gap-2 border-b border-default px-3 py-3">
          <Search className="size-5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts, questions, communities, people..."
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </form>

        <div className="max-h-[70vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Type at least 2 characters to search</div>
          ) : !isFetching && !hasResults ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No results found for &quot;{query.trim()}&quot;</div>
          ) : (
            <>
              {!!data?.posts.length && <Section title="Posts">{data.posts.map((post) => <PostRow key={post.id} post={post} />)}</Section>}
              {!!data?.qaPosts.length && <Section title="Questions">{data.qaPosts.map((post) => <PostRow key={post.id} post={post} question />)}</Section>}
              {!!data?.communities.length && <Section title="Communities">{data.communities.map((community) => <CommunityRow key={community.id} community={community} />)}</Section>}
              {!!data?.profiles.length && <Section title="People">{data.profiles.map((profile) => <ProfileRow key={profile.id} profile={profile} />)}</Section>}
              {hasResults && (
                <button
                  type="button"
                  onClick={() => goTo(`/search?q=${encodeURIComponent(query.trim())}`)}
                  className="mt-2 flex w-full items-center justify-center rounded-md border border-default px-3 py-2 text-sm font-medium text-primary hover:bg-subtle"
                >
                  See all results
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
