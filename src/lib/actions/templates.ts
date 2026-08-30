"use server";

import { revalidatePath } from "next/cache";
import { canManageTemplates, requireSession, resolveSessionStaff } from "@/lib/auth";
import { logLetterAudit } from "@/lib/actions/audit";
import { extractMergeFields } from "@/lib/merge";
import { prisma } from "@/lib/prisma";
import { saveTemplateSchema } from "@/lib/schemas/document";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function saveTemplateVersionAction(
  input: unknown
): Promise<ActionResult<{ versionId: string; version: number }>> {
  try {
    const session = await requireSession();
    const staff = await resolveSessionStaff(session);
    if (!staff) return { ok: false, error: "UNAUTHORIZED" };
    if (!canManageTemplates(staff.role)) {
      return { ok: false, error: "Only ADMIN may change contract language." };
    }

    const parsed = saveTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid template." };
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: parsed.data.templateId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!template) return { ok: false, error: "Template not found." };

    const nextVersion = (template.versions[0]?.version ?? 0) + 1;
    const fields = extractMergeFields(parsed.data.body);

    const created = await prisma.$transaction(async (tx) => {
      const version = await tx.templateVersion.create({
        data: {
          templateId: template.id,
          version: nextVersion,
          body: parsed.data.body,
          changeNote: parsed.data.changeNote?.trim() || null,
          createdById: staff.id,
        },
      });
      await tx.documentTemplate.update({
        where: { id: template.id },
        data: {
          currentVersionId: version.id,
          mergeFieldsJson: JSON.stringify(fields),
        },
      });
      return version;
    });

    await logLetterAudit({
      actorId: staff.id,
      action: "TEMPLATE_VERSION",
      entityType: "TemplateVersion",
      entityId: created.id,
      summary: `Published ${template.documentType} v${nextVersion}`,
      meta: { changeNote: parsed.data.changeNote ?? null },
    });

    revalidatePath("/templates");
    revalidatePath(`/templates/${template.id}`);
    revalidatePath(`/templates/${template.id}/versions`);
    return { ok: true, data: { versionId: created.id, version: created.version } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save template.",
    };
  }
}
