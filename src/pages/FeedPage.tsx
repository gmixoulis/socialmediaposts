import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const QUERY_KEY_BASE = "posts";

export function FeedPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput]   = useState("");

  const queryKey = [QUERY_KEY_BASE, page, search];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => postsApi.list({ page, limit: 12, search: search || undefined }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(input);
    setPage(1);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search posts by title or content…"
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setInput(""); setPage(1); }}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results info */}
      {search && (
        <p className="mb-4 text-sm text-muted-foreground">
          {data?.total ?? 0} result{data?.total !== 1 ? "s" : ""} for <strong>"{search}"</strong>
        </p>
      )}

      {/* Posts grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load posts. Make sure the backend is running.
        </div>
      ) : data?.posts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No posts found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.posts.map(post => (
            <PostCard key={post.id} post={post} queryKey={queryKey} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 0) > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {data?.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))}
            disabled={page >= (data?.pages ?? 1)}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-muted transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
