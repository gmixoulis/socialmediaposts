import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, _ and - only"),
  email:    z.string().email(),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── Posts ─────────────────────────────────────────────────────────────────────
export const CreatePostSchema = z.object({
  title: z.string().transform((s) => s.trim()).pipe(z.string().min(1).max(255)),
  body:  z.string().transform((s) => s.trim()).pipe(z.string().min(1).max(10_000)),
});

// ── Pagination ────────────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().max(200).default(""),
});

// ── Response shapes (TypeScript types for the frontend to share) ──────────────
export type UserResponse = {
  id:        number;
  username:  string;
  email:     string;
  createdAt: string;
};

export type PostResponse = {
  id:         number;
  title:      string;
  body:       string;
  author:     string;
  createdAt:  string;
  likeCount:  number;
  likedByMe:  boolean;
};

export type PostListResponse = {
  posts: PostResponse[];
  total: number;
  page:  number;
  pages: number;
};

export type TokenResponse = {
  accessToken: string;
  tokenType:   "bearer";
  user:        UserResponse;
};

export type LikeResponse = {
  postId:    number;
  liked:     boolean;
  likeCount: number;
};
