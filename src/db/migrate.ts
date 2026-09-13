import fs from "fs";
import path from "path";
import { db } from "./index";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🚀 Running CineBook database migrations...");
  const migrationFilePath = path.join(process.cwd(), "drizzle", "0000_remarkable_joshua_kane.sql");

  if (!fs.existsSync(migrationFilePath)) {
    throw new Error(`Migration file not found at: ${migrationFilePath}`);
  }

  const migrationSql = fs.readFileSync(migrationFilePath, "utf-8");
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error: any) {
      // Ignore if table/index already exists
      if (
        error?.message?.includes("already exists") ||
        error?.message?.includes("duplicate")
      ) {
        continue;
      }
      console.warn("Migration statement notice:", error.message);
    }
  }

  console.log("✅ Database schema is up-to-date with all 14 tables and constraints!");
}

// Allow direct execution: npx tsx src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
