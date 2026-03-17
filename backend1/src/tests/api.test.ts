/**
 * Integration tests for the Social Posts Manager API.
 * Uses an in-memory libsql database via vi.mock.
 * Run: npm test
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema.js";

// ── Swap the DB client for an in-memory instance before any app code loads ───
const memClient = createClient({ url: ":memory:" });
const memDb     = drizzle(memClient, { schema });

vi.mock("../db/client.js", () => ({
  libsqlClient: memClient,
  db: memDb,
}));

// ── Now import everything that depends on db/client ──────────────────────────
const { migrate }    = await import("../db/migrate.js");
const { createApp }  = await import("../app.js");

const app = createApp();

// ── Request helpers ───────────────────────────────────────────────────────────
const req = (method: string, path: string, opts: RequestInit = {}) =>
  app.fetch(new Request(`http://localhost${path}`, { method, ...opts }));

const get  = (path: string, headers: Record<string, string> = {}) =>
  req("GET", path, { headers });

const post = (path: string, body: unknown = {}, headers: Record<string, string> = {}) =>
  req("POST", path, {
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const del  = (path: string, headers: Record<string, string> = {}) =>
  req("DELETE", path, { headers });

// ── Test helpers ──────────────────────────────────────────────────────────────
async function register(suffix: string) {
  const r = await post("/api/auth/register", {
    username: `user${suffix}`,
    email:    `user${suffix}@test.com`,
    password: "password123",
  });
  expect(r.status, `register(${suffix})`).toBe(201);
  return r.json() as Promise<{ accessToken: string; user: { id: number; username: string } }>;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── One-time schema creation ──────────────────────────────────────────────────
beforeAll(async () => {
  await migrate();
});

// ══════════════════════════════════════════════════════════════════════════════
describe("Auth", () => {
  it("registers and returns a token", async () => {
    const d = await register("a1");
    expect(d.accessToken).toBeTruthy();
    expect(d.user.username).toBe("usera1");
  });

  it("rejects duplicate email", async () => {
    await post("/api/auth/register", { username: "dupA", email: "dup@t.com", password: "pass123" });
    const r = await post("/api/auth/register", { username: "dupB", email: "dup@t.com", password: "pass123" });
    expect(r.status).toBe(409);
  });

  it("rejects duplicate username", async () => {
    await post("/api/auth/register", { username: "taken", email: "t1@t.com", password: "pass123" });
    const r = await post("/api/auth/register", { username: "taken", email: "t2@t.com", password: "pass123" });
    expect(r.status).toBe(409);
  });

  it("rejects short password", async () => {
    const r = await post("/api/auth/register", { username: "x", email: "x@t.com", password: "123" });
    expect(r.status).toBe(422);
  });

  it("logs in with correct credentials", async () => {
    await post("/api/auth/register", { username: "log1", email: "log1@t.com", password: "pass123" });
    const r = await post("/api/auth/login", { email: "log1@t.com", password: "pass123" });
    expect(r.status).toBe(200);
    expect((await r.json()).accessToken).toBeTruthy();
  });

  it("rejects wrong password", async () => {
    await post("/api/auth/register", { username: "wp1", email: "wp1@t.com", password: "correct" });
    const r = await post("/api/auth/login", { email: "wp1@t.com", password: "wrong" });
    expect(r.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    expect((await post("/api/auth/login", { email: "ghost@t.com", password: "x" })).status).toBe(401);
  });

  it("GET /auth/me returns the current user", async () => {
    const { accessToken } = await register("me1");
    const r = await get("/api/auth/me", auth(accessToken));
    expect(r.status).toBe(200);
    expect((await r.json()).username).toBe("userme1");
  });

  it("GET /auth/me → 401 without token", async () => {
    expect((await get("/api/auth/me")).status).toBe(401);
  });

  it("GET /auth/me → 401 with garbage token", async () => {
    expect((await get("/api/auth/me", { Authorization: "Bearer garbage" })).status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("Posts", () => {
  it("GET /posts returns correct shape", async () => {
    const body = await (await get("/api/posts")).json();
    expect(body).toHaveProperty("posts");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("pages");
  });

  it("POST /posts → 401 without auth", async () => {
    expect((await post("/api/posts", { title: "T", body: "B" })).status).toBe(401);
  });

  it("creates a post with correct fields", async () => {
    const { accessToken, user } = await register("cp1");
    const r = await post("/api/posts", { title: "Hello World", body: "Content" }, auth(accessToken));
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.title).toBe("Hello World");
    expect(body.author).toBe(user.username);
    expect(body.likeCount).toBe(0);
    expect(body.likedByMe).toBe(false);
  });

  it("rejects blank title", async () => {
    const { accessToken } = await register("cp2");
    const r = await post("/api/posts", { title: "   ", body: "body" }, auth(accessToken));
    expect(r.status).toBe(422);
  });

  it("rejects body over 10 000 chars", async () => {
    const { accessToken } = await register("cp3");
    const r = await post("/api/posts", { title: "T", body: "x".repeat(10_001) }, auth(accessToken));
    expect(r.status).toBe(422);
  });

  it("pagination pages don't overlap", async () => {
    const { accessToken } = await register("pag");
    for (let i = 0; i < 15; i++) {
      await post("/api/posts", { title: `Paged ${i}`, body: "b" }, auth(accessToken));
    }
    const p1 = await (await get("/api/posts?page=1&limit=10")).json();
    const p2 = await (await get("/api/posts?page=2&limit=10")).json();
    expect(p1.posts.length).toBe(10);
    const ids1 = new Set(p1.posts.map((p: any) => p.id));
    expect(p2.posts.every((p: any) => !ids1.has(p.id))).toBe(true);
  });

  it("search returns matching posts", async () => {
    const { accessToken } = await register("sr1");
    await post("/api/posts", { title: "UniqueXYZTitle", body: "body" }, auth(accessToken));
    const body = await (await get("/api/posts?search=UniqueXYZ")).json();
    expect(body.posts.some((p: any) => p.title.includes("UniqueXYZ"))).toBe(true);
  });

  it("search with no match returns total=0", async () => {
    const body = await (await get("/api/posts?search=ZZZNOMATCH999")).json();
    expect(body.total).toBe(0);
  });

  it("anonymous viewer sees likedByMe=false, correct likeCount", async () => {
    const { accessToken } = await register("anon1");
    const pr = await (await post("/api/posts", { title: "AnonTest", body: "b" }, auth(accessToken))).json();
    await post(`/api/posts/${pr.id}/like`, {}, auth(accessToken));
    const feed = await (await get("/api/posts?search=AnonTest")).json();
    const found = feed.posts.find((p: any) => p.id === pr.id);
    expect(found?.likedByMe).toBe(false);
    expect(found?.likeCount).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("Likes", () => {
  async function makePost(suffix: string) {
    const user = await register(suffix);
    const pr = await (await post("/api/posts", { title: "LikeTestPost", body: "b" }, auth(user.accessToken))).json();
    return { user, postId: pr.id as number };
  }

  it("like → 401 without auth", async () => {
    const { postId } = await makePost("lra");
    expect((await post(`/api/posts/${postId}/like`, {})).status).toBe(401);
  });

  it("like returns liked=true and likeCount=1", async () => {
    const { user, postId } = await makePost("lk1");
    const body = await (await post(`/api/posts/${postId}/like`, {}, auth(user.accessToken))).json();
    expect(body.liked).toBe(true);
    expect(body.likeCount).toBe(1);
  });

  it("second like toggles back to liked=false", async () => {
    const { user, postId } = await makePost("ul1");
    await post(`/api/posts/${postId}/like`, {}, auth(user.accessToken));
    const body = await (await post(`/api/posts/${postId}/like`, {}, auth(user.accessToken))).json();
    expect(body.liked).toBe(false);
    expect(body.likeCount).toBe(0);
  });

  it("like nonexistent post → 404", async () => {
    const { accessToken } = await register("lne");
    expect((await post("/api/posts/999999/like", {}, auth(accessToken))).status).toBe(404);
  });

  it("GET /likes returns liked posts", async () => {
    const { user, postId } = await makePost("glp");
    await post(`/api/posts/${postId}/like`, {}, auth(user.accessToken));
    const body = await (await get("/api/likes", auth(user.accessToken))).json();
    expect(body.posts.some((p: any) => p.id === postId)).toBe(true);
  });

  it("GET /likes → 401 without auth", async () => {
    expect((await get("/api/likes")).status).toBe(401);
  });

  it("DELETE /likes/:id removes a like", async () => {
    const { user, postId } = await makePost("rl1");
    await post(`/api/posts/${postId}/like`, {}, auth(user.accessToken));
    expect((await del(`/api/likes/${postId}`, auth(user.accessToken))).status).toBe(204);
    const body = await (await get("/api/likes", auth(user.accessToken))).json();
    expect(body.posts.some((p: any) => p.id === postId)).toBe(false);
  });

  it("DELETE /likes clears all likes", async () => {
    const { accessToken } = await register("cal");
    for (let i = 0; i < 3; i++) {
      const pr = await (await post("/api/posts", { title: `CL${i}`, body: "b" }, auth(accessToken))).json();
      await post(`/api/posts/${pr.id}/like`, {}, auth(accessToken));
    }
    expect((await del("/api/likes", auth(accessToken))).status).toBe(204);
    expect((await (await get("/api/likes", auth(accessToken))).json()).total).toBe(0);
  });

  it("two users see likeCount=2 each with likedByMe=true", async () => {
    const u1 = await register("twolike_u1");
    const u2 = await register("twolike_u2");
    const pr = await (await post("/api/posts", { title: "TwoLikePost", body: "b" }, auth(u1.accessToken))).json();
    const pid = pr.id as number;

    const r1 = await (await post(`/api/posts/${pid}/like`, {}, auth(u1.accessToken))).json();
    expect(r1.liked).toBe(true);
    expect(r1.likeCount).toBe(1);

    const r2 = await (await post(`/api/posts/${pid}/like`, {}, auth(u2.accessToken))).json();
    expect(r2.liked).toBe(true);
    expect(r2.likeCount).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("Health", () => {
  it("GET /api/health → ok", async () => {
    const r = await get("/api/health");
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe("ok");
  });
});
