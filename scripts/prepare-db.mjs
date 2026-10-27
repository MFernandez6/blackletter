/**
 * Build-time DB prep.
 * - Postgres: migrate deploy + non-destructive bootstrap (staff + templates)
 * - Legacy sqlite URL: refused — BLACKLETTER is Postgres-only
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";

if (!url) {
  console.error("prepare-db: DATABASE_URL is required.");
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    "prepare-db: BLACKLETTER requires a Postgres DATABASE_URL (shared Supabase). SQLite is no longer supported."
  );
  process.exit(1);
}

console.log("prepare-db: applying Postgres migrations…");
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});

console.log("prepare-db: running non-destructive bootstrap…");
execSync("npx tsx prisma/bootstrap.ts", {
  stdio: "inherit",
  env: process.env,
});
