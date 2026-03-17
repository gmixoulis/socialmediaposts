import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);
const ALG = "HS256";
const EXPIRES_IN = process.env.JWT_EXPIRE_HOURS
  ? `${process.env.JWT_EXPIRE_HOURS}h`
  : "24h";

// ── Passwords ─────────────────────────────────────────────────────────────────

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Tokens ────────────────────────────────────────────────────────────────────

export async function createToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<number> {
  const { payload } = await jwtVerify(token, SECRET);
  const id = Number(payload.sub);
  if (!Number.isInteger(id)) throw new Error("Invalid token subject");
  return id;
}
