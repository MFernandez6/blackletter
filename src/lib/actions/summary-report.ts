"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canEdit, requireSession, resolveSessionStaff } from "@/lib/auth";
import { logLetterAudit } from "@/lib/actions/audit";
import { putSummaryReport } from "@/lib/integrations/blackbox-reports";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const inputSchema = z.object({
  header: z.record(z.string().max(1000)).default({}),
  sections: z.record(z.string().max(30000)).default({}),
  status: z.enum(["DRAFT", "FINAL"]).default("DRAFT"),
});

/** The report lives in BLACKBOX; this saves through its service API. */
export async function saveSummaryReportAction(
  blackboxClaimId: string,
  raw: unknown
): Promise<ActionResult> {
  const session = await requireSession();
  const staff = await resolveSessionStaff(session);
  if (!staff) return { ok: false, error: "UNAUTHORIZED" };
  if (!canEdit(staff.role)) return { ok: false, error: "Viewers cannot edit reports." };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed." };
  }

  const result = await putSummaryReport({
    claimId: blackboxClaimId,
    ...parsed.data,
    actorEmail: staff.email,
  });
  if (!result.ok) return { ok: false, error: result.error };

  await logLetterAudit({
    actorId: staff.id,
    action: "SUMMARY_REPORT_SAVE",
    entityType: "ClaimSummaryReport",
    entityId: blackboxClaimId,
    summary: `Saved the summary report on ${result.payload.claim.claimNumber} (stored in BLACKBOX)`,
    meta: { status: parsed.data.status },
  });

  revalidatePath(`/claims/${blackboxClaimId}/summary-report`);
  return { ok: true, data: undefined };
}
