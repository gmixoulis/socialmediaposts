import { useState } from "react";
import { Heart, Calendar, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi, type Post } from "@/lib/api";
import { useAuthStore } from "@/lib/useAuthStore";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  post: Post;
  queryKey?: unknown[];
}

export function PostCard({ post, queryKey }: PostCardProps) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => postsApi.toggleLike(post.id),
    // Optimistic update
    onMutate: async () => {
      if (queryKey) {
        await qc.cancelQueries({ queryKey });
        const previous = qc.getQueryData(queryKey);
        qc.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          // Handle paginated list
          if (old.posts) {
            return {
              ...old,
              posts: old.posts.map((p: Post) =>
                p.id === post.id
                  ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
                  : p
              ),
            };
          }
          return old;
        });
        return { previous };
      }
    },
    onError: (_err, _v, ctx: any) => { if (queryKey && ctx?.previous) qc.setQueryData(queryKey, ctx.previous); },
    onSettled: () => { if (queryKey) qc.invalidateQueries({ queryKey }); },
  });

  const handleLike = () => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    likeMutation.mutate();
  };

  const shortBody = post.body.length > 200 ? post.body.slice(0, 200) + "…" : post.body;

  return (
    <article className="group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      <div className="p-5">
        <h2 className="text-base font-semibold leading-tight mb-2 capitalize">{post.title}</h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {expanded ? post.body : shortBody}
          {post.body.length > 200 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="ml-1 text-primary hover:underline text-xs"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              post.likedByMe
                ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-all ${post.likedByMe ? "fill-pink-500 stroke-pink-500" : ""}`}
            />
            <span>{post.likeCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
