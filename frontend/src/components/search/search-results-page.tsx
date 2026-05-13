"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, HelpCircle, Loader2, Search, UserRound, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalSearch } from "@/hooks/search-hooks/use-global-search";
import { SearchTab, useSearchInfinite } from "@/hooks/search-hooks/use-search-infinite";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import {
  SearchCommunityCard,
  SearchProfileCard,
} from "@/components/search/search-result-cards";
import { PostCard } from "@/components/post/post-card";
import {
  SearchCommunityResult,
  SearchProfileResult,
} from "@/types/search/global-search-result";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

type TabValue = "all" | SearchTab;

const tabs: { value: TabValue; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "All", icon: Search },
  { value: "posts", label: "Posts", icon: FileText },
  { value: "questions", label: "Questions", icon: HelpCircle },
  { value: "communities", label: "Communities", icon: Users },
  { value: "profiles", label: "People", icon: UserRound },
];

function normalizeTab(value: string | null): TabValue {
  return tabs.some((tab) => tab.value === value) ? value as TabValue : "all";
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-default bg-card/70 shadow-card">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Search className="size-5" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function LoadingState({ label = "Searching..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <div className="flex size-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function InfiniteResults({ type, query }: { type: SearchTab; query: string }) {
  const result = useSearchInfinite(type, query);
  const pages = (result.data?.pages ?? []) as Array<{ data: Array<SelectPostDTO | SelectQAPostDTO | SearchCommunityResult | SearchProfileResult> }>;
  const items = pages.flatMap((page) => page.data);
  const sentinelRef = useIntersectionObserver(() => {
    if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
  });

  if (query.trim().length < 2) return <EmptyState message="Type at least 2 characters to search" />;
  if (result.isLoading) return <LoadingState />;
  if (result.isError) return <EmptyState message="Search failed. Try again." />;
  if (!items.length) return <EmptyState message={`No ${type === "profiles" ? "people" : type} found`} />;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {items.map((item) => {
        if (type === "posts") return <PostCard key={item.id} post={item as SelectPostDTO} />;
        if (type === "questions") return <PostCard key={item.id} post={item as SelectQAPostDTO} />;
        if (type === "communities") return <SearchCommunityCard key={item.id} community={item as never} />;
        return <SearchProfileCard key={item.id} profile={item as never} />;
      })}
      <div ref={sentinelRef} className="h-8" />
      {result.isFetchingNextPage && <LoadingState label="Loading more..." />}
      {!result.hasNextPage && items.length > 0 && (
        <p className="py-6 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          End of results
        </p>
      )}
    </div>
  );
}

function AllResults({ query, onSeeAll }: { query: string; onSeeAll: (tab: SearchTab) => void }) {
  const { data, isLoading, isError } = useGlobalSearch(query);
  const total = (data?.posts.length ?? 0) + (data?.qaPosts.length ?? 0) + (data?.communities.length ?? 0) + (data?.profiles.length ?? 0);

  if (query.trim().length < 2) return <EmptyState message="Type at least 2 characters to search" />;
  if (isLoading) return <LoadingState />;
  if (isError) return <EmptyState message="Search failed. Try again." />;
  if (!total) return <EmptyState message={`No results found for "${query}"`} />;

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {!!data?.posts.length && (
        <ResultSection title="Posts" count={data.posts.length} icon={FileText} onSeeAll={() => onSeeAll("posts")}>
          {data.posts.slice(0, 5).map((post) => <PostCard key={post.id} post={post} />)}
        </ResultSection>
      )}
      {!!data?.qaPosts.length && (
        <ResultSection title="Questions" count={data.qaPosts.length} icon={HelpCircle} onSeeAll={() => onSeeAll("questions")}>
          {data.qaPosts.slice(0, 5).map((post) => <PostCard key={post.id} post={post} />)}
        </ResultSection>
      )}
      {!!data?.communities.length && (
        <ResultSection title="Communities" count={data.communities.length} icon={Users} onSeeAll={() => onSeeAll("communities")}>
          {data.communities.slice(0, 5).map((community) => <SearchCommunityCard key={community.id} community={community} />)}
        </ResultSection>
      )}
      {!!data?.profiles.length && (
        <ResultSection title="People" count={data.profiles.length} icon={UserRound} onSeeAll={() => onSeeAll("profiles")}>
          {data.profiles.slice(0, 5).map((profile) => <SearchProfileCard key={profile.id} profile={profile} />)}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({
  title,
  count,
  icon: Icon,
  children,
  onSeeAll,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSeeAll: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-heading">{title}</h2>
            <p className="text-xs text-muted-foreground">{count} preview results</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onSeeAll}>
          See all
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SearchResultsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const activeTab = normalizeTab(searchParams.get("tab"));
  const [input, setInput] = useState(urlQuery);

  const query = useMemo(() => urlQuery.trim(), [urlQuery]);

  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  function updateUrl(nextQuery: string, nextTab: TabValue = activeTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", nextQuery);
    if (nextTab === "all") params.delete("tab");
    else params.set("tab", nextTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 2) return;
    updateUrl(trimmed, "all");
  }

  function handleTabChange(value: string) {
    updateUrl(query, normalizeTab(value));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-4 sm:px-6 xl:px-0">
      <div className="relative z-10 fade-in">
        <div className="absolute -inset-1 -z-10 rounded-full bg-linear-to-r from-primary to-primary/60 opacity-20 blur-2xl dark:opacity-10" />
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-heading md:text-3xl">
              Search
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Find posts, questions, communities, and people across DevNexus.
            </p>
          </div>

          <form onSubmit={submit} className="relative flex w-full gap-2 sm:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search DevNexus"
              className="h-11 rounded-lg border-default bg-card pl-10 text-base shadow-sm focus-visible:ring-primary/40"
            />
            <Button type="submit" variant="custom" className="btn-secondary h-11 shrink-0 gap-2">
              <Search className="size-4" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-0">
        <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto rounded-lg border border-default bg-card p-1 shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-9 min-w-fit px-3 data-[state=active]:border-primary/30 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-active:border-primary/30 data-active:bg-primary data-active:text-primary-foreground"
              >
                <Icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value="all" className="mt-5">
          {activeTab === "all" && <AllResults query={query} onSeeAll={(tab) => updateUrl(query, tab)} />}
        </TabsContent>
        <TabsContent value="posts" className="mt-5">
          {activeTab === "posts" && <InfiniteResults type="posts" query={query} />}
        </TabsContent>
        <TabsContent value="questions" className="mt-5">
          {activeTab === "questions" && <InfiniteResults type="questions" query={query} />}
        </TabsContent>
        <TabsContent value="communities" className="mt-5">
          {activeTab === "communities" && <InfiniteResults type="communities" query={query} />}
        </TabsContent>
        <TabsContent value="profiles" className="mt-5">
          {activeTab === "profiles" && <InfiniteResults type="profiles" query={query} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
