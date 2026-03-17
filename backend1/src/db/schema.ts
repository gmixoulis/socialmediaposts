import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id:           integer("id").primaryKey({ autoIncrement: true }),
    username:     text("username").notNull().unique(),
    email:        text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
  }
);

// ── Posts ─────────────────────────────────────────────────────────────────────
export const posts = sqliteTable(
  "posts",
  {
    id:         integer("id").primaryKey({ autoIncrement: true }),
    title:      text("title").notNull(),
    body:       text("body").notNull(),
    authorName: text("author_name").notNull().default("Anonymous"),
    userId:     integer("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt:  text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [
    index("ix_posts_created").on(t.createdAt),
    index("ix_posts_user").on(t.userId),
  ]
);

// ── Likes ─────────────────────────────────────────────────────────────────────
export const likes = sqliteTable(
  "likes",
  {
    id:        integer("id").primaryKey({ autoIncrement: true }),
    userId:    integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId:    integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("uq_likes_user_post").on(t.userId, t.postId),
    index("ix_likes_post").on(t.postId),
    index("ix_likes_user").on(t.userId),
  ]
);

// ── Inferred TypeScript types ─────────────────────────────────────────────────
export type User    = typeof users.$inferSelect;
export type Post    = typeof posts.$inferSelect;
export type Like    = typeof likes.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewPost = typeof posts.$inferInsert;
