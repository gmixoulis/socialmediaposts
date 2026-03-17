import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import likesRouter from "./routes/likes.js";

export function createApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000").split(","),
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.route("/api/auth",  authRouter);
  app.route("/api/posts", postsRouter);
  app.route("/api/likes", likesRouter);

  app.get("/api/health", (c) => c.json({ status: "ok" }));

  app.notFound((c) => c.json({ error: "Not found." }, 404));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error." }, 500);
  });

  return app;
}
