/**
 * Vercel / CI: materialize a seeded SQLite file so serverless instances
 * have staff + templates. Skipped when DATABASE_URL is Postgres.
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (/^postgres(ql)?:\/\//i.test(url)) {
  console.log("prepare-db: Postgres URL set — skipping local sqlite seed.");
  process.exit(0);
}

process.env.DATABASE_URL = url || "file:./dev.db";
process.env.ALLOW_DESTRUCTIVE_SEED = "1";

console.log("prepare-db: pushing sqlite schema and seeding…");
execSync("npx prisma db push --skip-generate --accept-data-loss", {
  stdio: "inherit",
  env: process.env,
});
execSync("npx prisma db seed", {
  stdio: "inherit",
  env: process.env,
});
