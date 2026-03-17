import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { createToken, hashPassword, verifyPassword } from "../lib/auth.js";
import { LoginSchema, RegisterSchema } from "../lib/types.js";
import { requireAuth } from "../middleware/auth.js";
import type { UserResponse, TokenResponse } from "../lib/types.js";

const router = new Hono();

// POST /auth/register
router.post("/register", async (c) => {
  const parsed = RegisterSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 422);
  const { username, email, password } = parsed.data;

  const existingEmail = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existingEmail) return c.json({ error: "Email already registered." }, 409);

  const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
  if (existingUsername) return c.json({ error: "Username already taken." }, 409);

  const [user] = await db.insert(users).values({
    username,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
  }).returning();

  const userOut: UserResponse = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  const body: TokenResponse = { accessToken: await createToken(user.id), tokenType: "bearer", user: userOut };
  return c.json(body, 201);
});

// POST /auth/login
router.post("/login", async (c) => {
  const parsed = LoginSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid request." }, 422);
  const { email, password } = parsed.data;

  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) return c.json({ error: "Invalid email or password." }, 401);

  const userOut: UserResponse = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  const body: TokenResponse = { accessToken: await createToken(user.id), tokenType: "bearer", user: userOut };
  return c.json(body);
});

// GET /auth/me
router.get("/me", requireAuth, (c) => {
  const user = c.get("user");
  const out: UserResponse = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  return c.json(out);
});

export default router;
