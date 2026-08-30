import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function bundledSqlitePath() {
  return path.join(process.cwd(), "prisma", "dev.db");
}

function resolveDatabaseUrl(): string | undefined {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured && !configured.startsWith("file:")) {
    return configured;
  }

  if (process.env.VERCEL) {
    const dest = "/tmp/blackletter.db";
    const source = bundledSqlitePath();
    if (!existsSync(dest) && existsSync(source)) {
      copyFileSync(source, dest);
    }
    return `file:${dest}`;
  }

  return configured || "file:./dev.db";
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: url ? { db: { url } } : undefined,
  });
}

/**
 * Lazy client so Next.js "collect page data" during `next build` does not
 * instantiate Prisma (and require DATABASE_URL) at import time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = (globalForPrisma.prisma ??= createPrismaClient());
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
