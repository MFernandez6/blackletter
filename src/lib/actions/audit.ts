import { prisma } from "@/lib/prisma";

export async function logLetterAudit(opts: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  meta?: unknown;
}) {
  await prisma.letterAuditEvent.create({
    data: {
      actorId: opts.actorId,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      summary: opts.summary,
      metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
}
