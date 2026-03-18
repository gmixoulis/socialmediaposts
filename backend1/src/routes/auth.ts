import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { createToken, hashPassword, verifyPassword } from "../lib/auth.js";
import { LoginSchema, RegisterSchema } from "../lib/types.js";
import { requireAuth } from "../middleware/auth.js";
import type { UserResponse, TokenResponse } from "../lib/types.js";

const router = new Hono();

router.post("/register", async (c) => {
  let p = RegisterSchema.safeParse(await c.req.json()); // get body
  if (!p.success) return c.json({ error: p.error.issues[0].message }, 422);
  let { username, email: em, password: pw } = p.data;

  let e = await db.select().from(users).where(eq(users.email, em.toLowerCase())).get();
  if (e) return c.json({ error: "Email already registered." }, 409);

  let u = await db.select().from(users).where(eq(users.username, username)).get();
  if (u) return c.json({ error: "Username already taken." }, 409);

  const [user] = await db.insert(users).values({
    username,
    email: em.toLowerCase(),
    passwordHash: await hashPassword(pw),
  }).returning();

  let out123: UserResponse = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  let bbb: TokenResponse = { accessToken: await createToken(user.id), tokenType: "bearer", user: out123 };
  return c.json(bbb, 201);
});

router.post("/login", async (c) => {
  let loginParsed = LoginSchema.safeParse(await c.req.json()); // check login
  if (!loginParsed.success) return c.json({ error: "Invalid request." }, 422);
  let { email: le, password: lp } = loginParsed.data;

  let usr = await db.select().from(users).where(eq(users.email, le.toLowerCase())).get();
  let v = usr ? await verifyPassword(lp, usr.passwordHash) : false;
  if (!usr || !v) return c.json({ error: "Invalid email or password." }, 401);

  let uOut: UserResponse = { id: usr.id, username: usr.username, email: usr.email, createdAt: usr.createdAt };
  let lolBody: TokenResponse = { accessToken: await createToken(usr.id), tokenType: "bearer", user: uOut };
  return c.json(lolBody);
});

router.get("/me", requireAuth, (c) => {
  const u = c.get("user");
  const o: UserResponse = { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt };
  return c.json(o);
});

export default router;
