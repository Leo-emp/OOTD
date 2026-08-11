import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { requireEnv } from "@/lib/env";

// Lazy-initialized Turso client — avoids crash at build time when env vars aren't set
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!_db) {
      const client = createClient({
        url: requireEnv("TURSO_DATABASE_URL"),
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      _db = drizzle(client, { schema });
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
