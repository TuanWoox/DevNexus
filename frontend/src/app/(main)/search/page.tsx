import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResultsPage } from "@/components/search/search-results-page";

export const metadata: Metadata = {
  title: "Search",
  description: "Search posts, questions, communities, and people on DevNexus.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading search...</div>}>
      <SearchResultsPage />
    </Suspense>
  );
}
