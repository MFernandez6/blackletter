"use server";

import { revalidatePath } from "next/cache";
import { canEdit, requireSession, resolveSessionStaff } from "@/lib/auth";
import { logLetterAudit } from "@/lib/actions/audit";
import { DOCUMENT_TYPE_LABELS, TRIGGERS_LEDGER_PAYOUT } from "@/lib/constants";
import { attachExecutedToBlackbox } from "@/lib/integrations/blackbox";
import { triggerLedgerPayout } from "@/lib/integrations/blackledger";
import { pullBlackmirrorScope } from "@/lib/integrations/blackmirror";
import { createSignWellDocument } from "@/lib/integrations/signwell";
import { mergeTemplate, valuesFromClaim } from "@/lib/merge";
import { prisma } from "@/lib/prisma";
import {
  generateDocumentSchema,
  sendForSignatureSchema,
} from "@/lib/schemas/document";
import { documentHtmlFile, storeLetterDocument } from "@/lib/storage";
import type { DocumentType } from "@/lib/types";
import { parseJson } from "@/lib/utils";
import type { MirrorScope } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateDocs(claimId: string, docId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/generate");
  revalidatePath(`/generate/${claimId}`);
  revalidatePath(`/claims/${claimId}`);
  revalidatePath("/tracker");
  if (docId) revalidatePath(`/documents/${docId}`);
}

export async function generateDocumentAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const staff = await resolveSessionStaff(session);
    if (!staff) return { ok: false, error: "UNAUTHORIZED" };
    if (!canEdit(staff.role)) {
      return { ok: false, error: "Viewers cannot generate documents." };
    }

    const parsed = generateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid generate request." };
    }

    const claim = await prisma.claimMirror.findUnique({
      where: { id: parsed.data.claimMirrorId },
    });
    if (!claim) return { ok: false, error: "Claim not found." };

    const template = await prisma.documentTemplate.findUnique({
      where: { documentType: parsed.data.documentType },
    });
    if (!template?.currentVersionId) {
      return { ok: false, error: "Template has no published version." };
    }
    const version = await prisma.templateVersion.findUnique({
      where: { id: template.currentVersionId },
    });
    if (!version) return { ok: false, error: "Template version missing." };

    const scope = await pullBlackmirrorScope({
      claimMirrorId: claim.id,
      blackboxClaimId: claim.blackboxClaimId,
    });
    const cachedScope = parseJson<MirrorScope>(claim.mirrorScopeJson, {});
    const mergedScope = { ...cachedScope, ...scope };

    const values = valuesFromClaim({
      ...claim,
      scopeSummary: mergedScope.scopeSummary ?? null,
      photoCount: mergedScope.photoCount ?? null,
    });
    const mergedBody = mergeTemplate(version.body, values);
    const title = `${DOCUMENT_TYPE_LABELS[parsed.data.documentType as DocumentType]} — ${claim.claimNumber}`;

    const stored = await storeLetterDocument({
      claimNumber: claim.claimNumber,
      fileName: `${template.documentType}-${claim.claimNumber}.html`,
      bytes: documentHtmlFile(title, mergedBody),
      mimeType: "text/html; charset=utf-8",
    });

    const doc = await prisma.generatedDocument.create({
      data: {
        claimMirrorId: claim.id,
        blackboxClaimId: claim.blackboxClaimId,
        claimNumber: claim.claimNumber,
        templateId: template.id,
        templateVersionId: version.id,
        documentType: template.documentType,
        title,
        mergedBody,
        mergeValuesJson: JSON.stringify(values),
        status: "draft",
        fileUrl: stored.fileUrl,
        fileName: stored.storagePath.split("/").pop() ?? stored.storagePath,
        generatedById: staff.id,
        notes: parsed.data.notes ?? null,
      },
    });

    await logLetterAudit({
      actorId: staff.id,
      action: "DOCUMENT_GENERATE",
      entityType: "GeneratedDocument",
      entityId: doc.id,
      summary: `Generated ${template.documentType} v${version.version} for ${claim.claimNumber}`,
    });

    revalidateDocs(claim.id, doc.id);
    return { ok: true, data: { id: doc.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to generate document.",
    };
  }
}

export async function sendForSignatureAction(
  input: unknown
): Promise<ActionResult<{ signatureRequestId: string; dryRun: boolean }>> {
  try {
    const session = await requireSession();
    const staff = await resolveSessionStaff(session);
    if (!staff) return { ok: false, error: "UNAUTHORIZED" };
    if (!canEdit(staff.role)) {
      return { ok: false, error: "Viewers cannot send for signature." };
    }

    const parsed = sendForSignatureSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid send request." };

    const doc = await prisma.generatedDocument.findUnique({
      where: { id: parsed.data.generatedDocumentId },
      include: { claim: true },
    });
    if (!doc) return { ok: false, error: "Document not found." };
    if (!doc.fileUrl) return { ok: false, error: "Document has no stored file." };

    const recipientName =
      parsed.data.recipientName ??
      `${doc.claim.claimantFirstName} ${doc.claim.claimantLastName}`.trim();
    const recipientEmail =
      parsed.data.recipientEmail ?? doc.claim.claimantEmail;
    if (!recipientEmail) {
      return { ok: false, error: "Claimant email is required to send for signature." };
    }

    const sent = await createSignWellDocument({
      name: doc.title,
      fileUrl: absoluteFileUrl(doc.fileUrl),
      fileName: doc.fileName ?? `${doc.documentType}.html`,
      recipientName,
      recipientEmail,
    });

    const request = await prisma.signatureRequest.create({
      data: {
        generatedDocumentId: doc.id,
        provider: "signwell",
        providerDocumentId: sent.providerDocumentId,
        embeddedUrl: sent.embeddedUrl,
        status: sent.status,
        recipientName,
        recipientEmail,
        testMode: sent.dryRun || process.env.SIGNWELL_TEST_MODE !== "0",
        requestedById: staff.id,
        lastEventType: sent.dryRun ? "dry_run_sent" : "document_sent",
        lastEventAt: new Date(),
      },
    });

    await prisma.generatedDocument.update({
      where: { id: doc.id },
      data: { status: "sent", sentAt: new Date() },
    });

    await logLetterAudit({
      actorId: staff.id,
      action: "DOCUMENT_SEND",
      entityType: "SignatureRequest",
      entityId: request.id,
      summary: sent.dryRun
        ? `Dry-run send ${doc.documentType} for ${doc.claimNumber}`
        : `Sent ${doc.documentType} to SignWell for ${doc.claimNumber}`,
    });

    revalidateDocs(doc.claimMirrorId, doc.id);
    return {
      ok: true,
      data: { signatureRequestId: request.id, dryRun: sent.dryRun },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to send to SignWell.",
    };
  }
}

export async function markExecutedAction(
  generatedDocumentId: string
): Promise<ActionResult<{ ledgerPayoutId?: string | null }>> {
  try {
    const session = await requireSession();
    const staff = await resolveSessionStaff(session);
    if (!staff) return { ok: false, error: "UNAUTHORIZED" };
    if (!canEdit(staff.role)) {
      return { ok: false, error: "Viewers cannot mark documents executed." };
    }

    const result = await applyExecutedStatus(generatedDocumentId, staff.id);
    if (!result.ok) return result;

    revalidateDocs(result.claimMirrorId, generatedDocumentId);
    return { ok: true, data: { ledgerPayoutId: result.ledgerPayoutId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to mark executed.",
    };
  }
}

export async function applyExecutedStatus(
  generatedDocumentId: string,
  actorId: string
): Promise<
  | {
      ok: true;
      claimMirrorId: string;
      ledgerPayoutId: string | null;
    }
  | { ok: false; error: string }
> {
  const doc = await prisma.generatedDocument.findUnique({
    where: { id: generatedDocumentId },
    include: { claim: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };

  const now = new Date();
  let ledgerPayoutId = doc.ledgerPayoutId;

  if (
    TRIGGERS_LEDGER_PAYOUT.includes(doc.documentType as DocumentType) &&
    !ledgerPayoutId
  ) {
    const ledger = await triggerLedgerPayout({
      claimNumber: doc.claimNumber,
      blackboxClaimId: doc.blackboxClaimId,
      settlementAmount: doc.claim.settlementAmount,
      settlementDate: doc.claim.settlementDate
        ? doc.claim.settlementDate.toISOString().slice(0, 10)
        : null,
      generatedDocumentId: doc.id,
      notes: `Opened from executed ${doc.documentType}`,
    });
    if (!ledger.ok) {
      return { ok: false, error: ledger.error ?? "BLACKLEDGER payout failed." };
    }
    ledgerPayoutId = ledger.payoutId ?? (ledger.dryRun ? "dry-run" : null);
  }

  if (doc.fileUrl) {
    await attachExecutedToBlackbox({
      claimId: doc.blackboxClaimId,
      fileName: doc.fileName ?? `${doc.documentType}.html`,
      fileUrl: absoluteFileUrl(doc.fileUrl),
      mimeType: "text/html; charset=utf-8",
    });
  }

  await prisma.generatedDocument.update({
    where: { id: doc.id },
    data: {
      status: "executed",
      signedAt: doc.signedAt ?? now,
      executedAt: now,
      ledgerPayoutId,
    },
  });

  await logLetterAudit({
    actorId,
    action: "DOCUMENT_EXECUTED",
    entityType: "GeneratedDocument",
    entityId: doc.id,
    summary: `Executed ${doc.documentType} on ${doc.claimNumber}`,
  });

  return { ok: true, claimMirrorId: doc.claimMirrorId, ledgerPayoutId };
}

function absoluteFileUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3004").replace(
    /\/$/,
    ""
  );
  return `${base}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}
