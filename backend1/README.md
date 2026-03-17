# Social Posts Manager — Node.js Backend

A clean REST API built with **Hono + Drizzle ORM + TypeScript**.

---

## Quick Start

```bash
npm install

# Dev (hot reload)
npm run dev

# Production
npm start

# Tests (29 integration tests, in-memory DB)
npm test
```

API available at **http://localhost:5000**

---

## Stack

| Concern | Library | Why |
|---------|---------|-----|
| HTTP framework | [Hono](https://hono.dev) | TypeScript-native, fast, minimal |
| ORM | [Drizzle](https://orm.drizzle.team) | Type-safe SQL, no binary downloads |
| Database driver | [@libsql/client](https://github.com/libsql/libsql-client-ts) | Pure JS SQLite — works everywhere |
| Passwords | bcryptjs | Adaptive hashing, work factor 12 |
| Auth tokens | jose | JWT sign/verify with Web Crypto API |
| Validation | zod | Runtime schema validation with TypeScript inference |
| Tests | vitest | Fast, ESM-native, vi.mock support |

---

## Project Structure

```
src/
├── index.ts              Entry point: start server, run migrate + seed
├── app.ts                Hono app factory — CORS, routes, error handling
├── db/
│   ├── schema.ts         Drizzle schema (single source of truth for DB + TS types)
│   ├── client.ts         libsql + drizzle instance
│   └── migrate.ts        CREATE TABLE IF NOT EXISTS (no migration files needed)
├── lib/
│   ├── auth.ts           hashPassword, verifyPassword, createToken, verifyToken
│   └── types.ts          Zod schemas + TypeScript response types
├── middleware/
│   └── auth.ts           requireAuth / optionalAuth Hono middleware
├── routes/
│   ├── auth.ts           POST /auth/register, POST /auth/login, GET /auth/me
│   ├── posts.ts          GET /posts, POST /posts, POST /posts/:id/like
│   └── likes.ts          GET /likes, DELETE /likes/:id, DELETE /likes
└── tests/
    └── api.test.ts       29 integration tests
```

---

## API Reference

All routes are prefixed `/api`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register. Returns `{ accessToken, user }` |
| `POST` | `/auth/login`    | — | Login. Returns `{ accessToken, user }` |
| `GET`  | `/auth/me`       | ✓ | Current user info |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/posts?page=1&limit=12&search=` | — | Paginated feed with search |
| `POST` | `/posts` | ✓ | Create a post |
| `POST` | `/posts/:id/like` | ✓ | Toggle like on/off |

### Likes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/likes`      | ✓ | All posts liked by current user |
| `DELETE` | `/likes/:id`  | ✓ | Remove one like |
| `DELETE` | `/likes`      | ✓ | Clear all likes |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | `{ status: "ok" }` |

---

## Environment Variables

Create a `.env` file (or set in your environment):

```env
DATABASE_URL=file:./dev.db    # SQLite file path. Use file::memory: for ephemeral.
JWT_SECRET=change-me          # Change before deploying
JWT_EXPIRE_HOURS=24
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

To use **PostgreSQL** in production, swap `@libsql/client` for `postgres` and update the Drizzle client — the schema and query code is unchanged.

---

## Design Decisions

**Hono over Express** — Express has no built-in TypeScript support and its middleware types are loose. Hono is designed for TypeScript from the ground up: route handlers are fully typed, context variables (like `c.get("user")`) are declared in an interface and type-checked at compile time.

**Drizzle over Prisma** — Prisma downloads a native query engine binary at install time, which breaks in restricted environments and adds ~50MB to deployments. Drizzle is pure JavaScript: the schema is TypeScript, queries compile to SQL strings, and there's nothing to download.

**Zod + TypeScript** — Request validation (`RegisterSchema`, `CreatePostSchema`) uses Zod. The inferred types flow through to response shapes without duplication. One schema → one type → one source of truth shared with the frontend if desired.

**bcrypt work factor 12** — ~250ms per hash is intentionally slow, making offline brute-force unfeasible.

**`and()` for compound WHERE clauses** — Drizzle's chained `.where().where()` replaces conditions rather than ANDing them (unlike ActiveRecord or SQLAlchemy). Always use `and(cond1, cond2)` for compound filters — a subtle gotcha this project learned the hard way.

**`UNIQUE(user_id, post_id)` on likes** — Idempotency enforced at the database level. Two concurrent like requests can't both insert; one gets a constraint error while the other succeeds cleanly.

**In-memory DB for tests** — `vi.mock("../db/client.js")` replaces the client module with an in-memory libsql instance before any route code imports it. No test DB files, no cleanup, no isolation issues between runs.

---

## Bonus Features

- **Full-text search** — `?search=` filters posts by title and body with `LIKE`
- **Pagination** — server-side with `page`/`limit` params; response includes `total` and `pages`
- **29 integration tests** — cover all routes including edge cases (duplicate users, wrong passwords, 404s, toggle idempotency, anonymous vs authenticated views)
- **Auto-seeding** — fetches 100 posts from JSONPlaceholder on startup; falls back to 100 local posts if offline
- **Graceful error handling** — `app.onError` and `app.notFound` return consistent JSON
