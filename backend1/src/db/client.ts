import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export const libsqlClient = createClient({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const db = drizzle(libsqlClient, { schema });
