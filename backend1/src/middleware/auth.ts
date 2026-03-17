import type { Context, Next } from "hono";
import { verifyToken } from "../lib/auth.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { User } from "../db/schema.js";

// Extend Hono context variables
declare module "hono" {
  interface ContextVariableMap {
    user:         User;
    userOrNull:   User | null;
  }
}

function extractToken(c: Context): string | null {
  const auth = c.req.header("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/** Requires a valid JWT. Returns 401 if missing or invalid. */
export async function requireAuth(c: Context, next: Next) {
  const token = extractToken(c);
  if (!token) return c.json({ error: "Not authenticated." }, 401);

  try {
    const userId = await verifyToken(token);
    const user   = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return c.json({ error: "User not found." }, 401);
    c.set("user", user);
    return next();
  } catch {
    return c.json({ error: "Invalid or expired token." }, 401);
  }
}

/** Attaches user to context if token present, but doesn't block the request. */
export async function optionalAuth(c: Context, next: Next) {
  const token = extractToken(c);
  c.set("userOrNull", null);

  if (token) {
    try {
      const userId = await verifyToken(token);
      const user   = await db.select().from(users).where(eq(users.id, userId)).get();
      if (user) c.set("userOrNull", user);
    } catch {
      // invalid token → treat as anonymous
    }
  }
  return next();
}
