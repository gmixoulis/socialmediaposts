import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { likesApi } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { Trash2, Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/useAuthStore";

const QUERY_KEY = ["likes"];

export function LikedPostsPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Redirect if not logged in
  if (!isAuthenticated) { navigate("/auth"); return null; }

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: likesApi.list,
  });

  const removeMutation = useMutation({
    mutationFn: likesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const clearMutation = useMutation({
    mutationFn: likesApi.clearAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
            Liked Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} post{data?.total !== 1 ? "s" : ""} liked
          </p>
        </div>

        {(data?.posts.length ?? 0) > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {clearMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data?.posts.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">You haven't liked any posts yet.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Browse the feed
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.posts.map(post => (
            <div key={post.id} className="relative group">
              <PostCard post={post} queryKey={QUERY_KEY} />
              <button
                onClick={() => removeMutation.mutate(post.id)}
                disabled={removeMutation.isPending}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                title="Remove from liked"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
