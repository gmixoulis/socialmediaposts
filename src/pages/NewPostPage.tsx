import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, PenSquare } from "lucide-react";

export function NewPostPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? "Failed to create post.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate({ title, body });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PenSquare className="h-5 w-5 text-primary" />
            Create a New Post
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Title</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Give your post a title…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Body</span>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Write something interesting…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-y transition"
            />
            <span className="text-xs text-muted-foreground text-right">{body.length} / 10,000</span>
          </label>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
