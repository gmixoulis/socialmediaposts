import { Hono } from "hono";
import { eq, like, or, desc, count, sql, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { posts, likes, users } from "../db/schema.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { CreatePostSchema, PaginationSchema } from "../lib/types.js";
import type { PostResponse, PostListResponse, LikeResponse } from "../lib/types.js";

const router = new Hono();

// GET /posts
router.get("/", optionalAuth, async (c) => {
  const parsed = PaginationSchema.safeParse({
    page:   c.req.query("page"),
    limit:  c.req.query("limit"),
    search: c.req.query("search"),
  });
  if (!parsed.success) return c.json({ error: "Invalid query params." }, 422);
  const { page, limit, search } = parsed.data;

  const currentUser = c.get("userOrNull");
  const offset = (page - 1) * limit;

  // Build WHERE clause for search
  const where = search
    ? or(like(posts.title, `%${search}%`), like(posts.body, `%${search}%`))
    : undefined;

  // Total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(posts)
    .where(where);

  // Fetch posts with author username via left join
  const rows = await db
    .select({
      id:         posts.id,
      title:      posts.title,
      body:       posts.body,
      authorName: posts.authorName,
      username:   users.username,
      userId:     posts.userId,
      createdAt:  posts.createdAt,
      likeCount:  sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  // Get liked post IDs for current user
  const likedIds = new Set<number>();
  if (currentUser) {
    const userLikes = await db
      .select({ postId: likes.postId })
      .from(likes)
      .where(eq(likes.userId, currentUser.id));
    userLikes.forEach((l) => likedIds.add(l.postId));
  }

  const postList: PostResponse[] = rows.map((r) => ({
    id:        r.id,
    title:     r.title,
    body:      r.body,
    author:    r.username ?? r.authorName,
    createdAt: r.createdAt,
    likeCount: Number(r.likeCount),
    likedByMe: likedIds.has(r.id),
  }));

  const body: PostListResponse = {
    posts: postList,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
  return c.json(body);
});

// POST /posts
router.post("/", requireAuth, async (c) => {
  const parsed = CreatePostSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 422);
  const { title, body: body_ } = parsed.data;

  const user = c.get("user");
  const [post] = await db.insert(posts).values({ title, body: body_, userId: user.id }).returning();

  const out: PostResponse = {
    id: post.id, title: post.title, body: post.body,
    author: user.username, createdAt: post.createdAt,
    likeCount: 0, likedByMe: false,
  };
  return c.json(out, 201);
});

// POST /posts/:id/like  (toggle)
router.post("/:id/like", requireAuth, async (c) => {
  const postId = Number(c.req.param("id"));
  const user   = c.get("user");

  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return c.json({ error: "Post not found." }, 404);

  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, user.id), eq(likes.postId, postId)))
    .get();

  let liked: boolean;
  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id));
    liked = false;
  } else {
    await db.insert(likes).values({ userId: user.id, postId });
    liked = true;
  }

  const [{ likeCount }] = await db
    .select({ likeCount: count() })
    .from(likes)
    .where(eq(likes.postId, postId));

  const body: LikeResponse = { postId, liked, likeCount };
  return c.json(body);
});

export default router;
