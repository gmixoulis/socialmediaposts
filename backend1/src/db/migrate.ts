import { libsqlClient } from "./client.js";

/**
 * Create all tables if they don't exist.
 * Simple approach that works for SQLite without needing migration files.
 * For production Postgres, switch to drizzle-kit migrations.
 */
export async function migrate(): Promise<void> {
  await libsqlClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      author_name TEXT NOT NULL DEFAULT 'Anonymous',
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS ix_posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS ix_posts_user    ON posts(user_id);

    CREATE TABLE IF NOT EXISTS likes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      post_id    INTEGER NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, post_id)
    );

    CREATE INDEX IF NOT EXISTS ix_likes_post ON likes(post_id);
    CREATE INDEX IF NOT EXISTS ix_likes_user ON likes(user_id);

    PRAGMA foreign_keys = ON;
  `);
}
