import { Hono } from "hono";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { likes, posts, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import type { PostResponse } from "../lib/types.js";

const router = new Hono();

// GET /likes  — all posts liked by the current user
router.get("/", requireAuth, async (c) => {
  const user = c.get("user");

  const rows = await db
    .select({
      id:         posts.id,
      title:      posts.title,
      body:       posts.body,
      authorName: posts.authorName,
      username:   users.username,
      createdAt:  posts.createdAt,
      likeCount:  sql<number>`(SELECT COUNT(*) FROM likes lc WHERE lc.post_id = ${posts.id})`,
    })
    .from(likes)
    .innerJoin(posts, eq(likes.postId, posts.id))
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(likes.userId, user.id))
    .orderBy(desc(likes.createdAt));

  const result: PostResponse[] = rows.map((r) => ({
    id:        r.id,
    title:     r.title,
    body:      r.body,
    author:    r.username ?? r.authorName,
    createdAt: r.createdAt,
    likeCount: Number(r.likeCount),
    likedByMe: true,
  }));

  return c.json({ posts: result, total: result.length });
});

// DELETE /likes/:postId  — remove one like
router.delete("/:postId", requireAuth, async (c) => {
  const postId = Number(c.req.param("postId"));
  const user   = c.get("user");
  await db.delete(likes).where(and(eq(likes.userId, user.id), eq(likes.postId, postId)));
  return new Response(null, { status: 204 });
});

// DELETE /likes  — clear all likes for the current user
router.delete("/", requireAuth, async (c) => {
  const user = c.get("user");
  await db.delete(likes).where(eq(likes.userId, user.id));
  return new Response(null, { status: 204 });
});

export default router;
