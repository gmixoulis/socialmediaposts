import { Hono } from "hono";
import { eq, like, or, desc, count, sql, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { posts, likes, users } from "../db/schema.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { CreatePostSchema, PaginationSchema } from "../lib/types.js";
import type { PostResponse, PostListResponse, LikeResponse } from "../lib/types.js";

const router = new Hono();

router.get("/", optionalAuth, async (c) => {
  console.log("got hit"); // lol
  const parsed = PaginationSchema.safeParse({
    page:   c.req.query("page"),
    limit:  c.req.query("limit"),
    search: c.req.query("search"),
  });
  if (!parsed.success) return c.json({ error: "bad params dude" }, 422);
  const { page, limit, search } = parsed.data;

  let u1 = c.get("userOrNull");
  let off = (page - 1) * limit; // pagination math always confuses me

  let w = search
    ? or(like(posts.title, `%${search}%`), like(posts.body, `%${search}%`))
    : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(posts)
    .where(w);

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
    .where(w)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(off);

  const likedIds = new Set<number>();
  if (u1) {
    const userLikes = await db
      .select({ postId: likes.postId })
      .from(likes)
      .where(eq(likes.userId, u1.id));
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

router.post("/", requireAuth, async (c) => {
  const parsed = CreatePostSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 422);
  const { title, body: b } = parsed.data;

  const user = c.get("user");
  let [p1] = await db.insert(posts).values({ title, body: b, userId: user.id }).returning();

  const out: PostResponse = {
    id: p1.id, title: p1.title, body: p1.body,
    author: user.username, createdAt: p1.createdAt,
    likeCount: 0, likedByMe: false,
  };
  return c.json(out, 201);
});

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

  let isLiked: boolean; // toggle state
  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id));
    isLiked = false;
  } else {
    // just insert it
    await db.insert(likes).values({ userId: user.id, postId });
    isLiked = true;
  }

  const [{ likeCount }] = await db
    .select({ likeCount: count() })
    .from(likes)
    .where(eq(likes.postId, postId));

  let finalBody: LikeResponse = { postId, liked: isLiked, likeCount };
  return c.json(finalBody);
});

export default router;
