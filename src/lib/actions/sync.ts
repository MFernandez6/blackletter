"use server";

import { revalidatePath } from "next/cache";
import { canEdit, requireSession, resolveSessionStaff } from "@/lib/auth";
import { logLetterAudit } from "@/lib/actions/audit";
import { pullBlackboxClaims } from "@/lib/integrations/blackbox";

export async function syncFromBlackboxAction() {
  const session = await requireSession();
  const staff = await resolveSessionStaff(session);
  if (!staff) return { ok: false as const, error: "UNAUTHORIZED" };
  if (!canEdit(staff.role)) {
    return { ok: false as const, error: "Viewers cannot sync claims." };
  }

  const result = await pullBlackboxClaims();
  if (!result.ok) return { ok: false as const, error: result.error ?? "Sync failed." };

  await logLetterAudit({
    actorId: staff.id,
    action: "BLACKBOX_SYNC",
    entityType: "ClaimMirror",
    summary: result.dryRun
      ? "BLACKBOX sync skipped (dry-run / local mirrors)"
      : `Synced ${result.upserted} claim mirrors from BLACKBOX`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/generate");
  revalidatePath("/claims");
  return {
    ok: true as const,
    dryRun: result.dryRun,
    upserted: result.upserted,
  };
}
