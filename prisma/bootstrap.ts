/**
 * Non-destructive production bootstrap for BLACKLETTER on Postgres.
 *
 * - Ensures Miguel exists (reuses public."Adjuster" password hash when available)
 * - Seeds the document template catalog when the library is empty
 *
 * Safe to re-run. Never wipes data.
 *
 *   npx tsx prisma/bootstrap.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { TEMPLATE_CATALOG } from "../src/lib/templates/catalog";
import { extractMergeFields } from "../src/lib/merge";

const KEEP_EMAIL = "miguel.fernandez@blacklineadjusting.com";
const FALLBACK_PASSWORD = "Password123!";

const prisma = new PrismaClient();

async function ensureMiguel() {
  const existing = await prisma.staff.findUnique({ where: { email: KEEP_EMAIL } });
  if (existing) {
    console.log("Staff already present:", existing.email);
    return existing;
  }

  let passwordHash: string | null = null;
  let name = "Miguel Fernandez";
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ name: string; passwordHash: string }>
    >(
      `select name, "passwordHash" from public."Adjuster" where email = $1 limit 1`,
      KEEP_EMAIL
    );
    if (rows[0]) {
      passwordHash = rows[0].passwordHash;
      name = rows[0].name || name;
      console.log("Copied password hash from public.Adjuster");
    }
  } catch (e) {
    console.log("Adjuster lookup skipped:", (e as Error).message.slice(0, 100));
  }

  if (!passwordHash) {
    passwordHash = await hash(FALLBACK_PASSWORD, 10);
    console.log("Created Miguel with fallback password — change it after login");
  }

  const miguel = await prisma.staff.create({
    data: {
      name,
      email: KEEP_EMAIL,
      passwordHash,
      role: "ADMIN",
      licenseNumber: "W123456",
    },
  });
  console.log("Created staff:", miguel.email);
  return miguel;
}

async function ensureTemplates(createdById: string) {
  const count = await prisma.documentTemplate.count();
  if (count > 0) {
    console.log(`Templates already present (${count}) — skipping catalog seed`);
    return;
  }

  console.log("Seeding document template catalog…");
  for (const entry of TEMPLATE_CATALOG) {
    const fields = extractMergeFields(entry.body);
    const template = await prisma.documentTemplate.create({
      data: {
        documentType: entry.documentType,
        name: entry.name,
        description: entry.description,
        stage: entry.stage,
        mergeFieldsJson: JSON.stringify(fields),
        createdById,
      },
    });
    const version = await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        body: entry.body,
        changeNote: "Initial catalog version",
        createdById,
      },
    });
    await prisma.documentTemplate.update({
      where: { id: template.id },
      data: { currentVersionId: version.id },
    });
    await prisma.documentStageMap.create({
      data: {
        documentType: entry.documentType,
        stage: entry.stage,
        claimStatusesJson: JSON.stringify(entry.claimStatuses),
        sortOrder: entry.sortOrder,
        required: entry.required,
        aobOnly: entry.aobOnly,
        templateId: template.id,
      },
    });
  }
  console.log(`Seeded ${TEMPLATE_CATALOG.length} templates`);
}

async function main() {
  const miguel = await ensureMiguel();
  await ensureTemplates(miguel.id);
  console.log("Bootstrap complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
