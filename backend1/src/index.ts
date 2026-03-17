import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { migrate } from "./db/migrate.js";
import { seedPosts } from "./seed.js";

const PORT = Number(process.env.PORT ?? 5000);

async function start() {
  await migrate();
  await seedPosts();

  const app = createApp();
  serve({ fetch: app.fetch, port: PORT });
  console.log(`Server running → http://localhost:${PORT}`);
  console.log(`API docs: no built-in UI — use the README endpoints`);
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
