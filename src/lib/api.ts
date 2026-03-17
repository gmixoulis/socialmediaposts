import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User { id: number; username: string; email: string; createdAt: string; }
export interface Post { id: number; title: string; body: string; author: string; createdAt: string; likeCount: number; likedByMe: boolean; }
export interface PostList { posts: Post[]; total: number; page: number; pages: number; }
export interface AuthResponse { accessToken: string; tokenType: string; user: User; }

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (d: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", d).then(r => r.data),
  login: (d: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", d).then(r => r.data),
  me: () => api.get<User>("/auth/me").then(r => r.data),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PostList>("/posts", { params }).then(r => r.data),
  create: (d: { title: string; body: string }) =>
    api.post<Post>("/posts", d).then(r => r.data),
  toggleLike: (postId: number) =>
    api.post<{ postId: number; liked: boolean; likeCount: number }>(`/posts/${postId}/like`).then(r => r.data),
};

// ── Likes ─────────────────────────────────────────────────────────────────────
export const likesApi = {
  list: () => api.get<{ posts: Post[]; total: number }>("/likes").then(r => r.data),
  remove: (postId: number) => api.delete(`/likes/${postId}`),
  clearAll: () => api.delete("/likes"),
};

export default api;
