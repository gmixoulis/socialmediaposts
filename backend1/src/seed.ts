import { db } from "./db/client.js";
import { posts } from "./db/schema.js";
import { count } from "drizzle-orm";



export async function seedPosts(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(posts);
  if (total >= 100) return;

  let data: { title: string; body: string; authorName: string }[] = [];

  try {
    const resp = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (resp.ok) {
      const raw = (await resp.json()) as { title: string; body: string; userId: number }[];
      data = raw.slice(0, 100).map((p) => ({
        title: p.title,
        body: p.body,
        authorName: `User ${p.userId}`,
      }));
      console.log(`Seeded ${data.length} posts from JSONPlaceholder.`);
    }
  } catch (err: any) {
    console.log("network unavailable inside docker -> using mini fallback. Error:", err.message);
    data = Array.from({ length: 15 }).map((_, i) => ({
      title: `Fallback Post ${i + 1}`,
      body: `This is a fallback post because the Docker container couldn't reach the internet. ${i}`,
      authorName: `Offline User`,
    }));
  }

  // Insert in batches of 50 to stay within SQLite parameter limits
  for (let i = 0; i < data.length; i += 50) {
    await db.insert(posts).values(data.slice(i, i + 50));
  }
}
