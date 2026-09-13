import * as schema from "./schema";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import path from "path";
import fs from "fs";

// Global singleton to prevent connection leaks during Next.js hot reload
const globalForDb = globalThis as unknown as {
  dbInstance?: any;
  pgliteInstance?: PGlite;
};

function initDb() {
  if (globalForDb.dbInstance) {
    return globalForDb.dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
    // Neon PostgreSQL over Serverless HTTP
    const sql = neon(databaseUrl);
    const db = drizzleNeon(sql, { schema });
    globalForDb.dbInstance = db;
    return db;
  }

  // Local persistent PGlite PostgreSQL WebAssembly engine
  const dataDir = path.join(process.cwd(), ".pgdata");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Ignore
    }
  }

  const pglite = globalForDb.pgliteInstance || new PGlite(dataDir);
  globalForDb.pgliteInstance = pglite;
  const db = drizzlePglite(pglite, { schema });
  globalForDb.dbInstance = db;
  return db;
}

export const db = initDb();
export { schema };
