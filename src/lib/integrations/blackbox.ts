import { prisma } from "@/lib/prisma";

export type BlackboxClaimRow = {
  id: string;
  claimNumber: string;
  status: string;
  lossType: string;
  isCatClaim?: boolean;
  dateOfLoss: string;
  propertyAddress: string;
  county: string;
  zipCode: string;
  carrierName?: string | null;
  policyNumber?: string | null;
  insurerClaimNumber?: string | null;
  estimatedValue?: number | null;
  demandAmount?: number | null;
  rcvAmount?: number | null;
  acvAmount?: number | null;
  settlementAmount?: number | null;
  settlementDate?: string | null;
  contingencyFeePercent?: number | null;
  assignedAdjuster?: string | null;
  assignedAdjusterLicense?: string | null;
  primaryClaimant?: string;
  claimantFirstName?: string;
  claimantLastName?: string;
  claimantEmail?: string;
  claimantPhone?: string;
  claimantMailing?: string;
  lossDescription?: string | null;
  deskExaminerName?: string | null;
  deskExaminerPhone?: string | null;
  deskExaminerEmail?: string | null;
  intakeNumber?: string | null;
};

function splitName(full: string | undefined): { first: string; last: string } {
  const parts = (full ?? "—").trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Ledger export accepts BLACKLEDGER_API_KEY; suite apps may set BLACKBOX_API_KEY instead. */
export function blackboxServiceKey(): string | undefined {
  return process.env.BLACKBOX_API_KEY?.trim() || process.env.BLACKLEDGER_API_KEY?.trim();
}

export async function pullBlackboxClaims(): Promise<{
  ok: boolean;
  dryRun: boolean;
  upserted: number;
  error?: string;
}> {
  const serviceKey = blackboxServiceKey();
  const dryRun = process.env.BLACKBOX_DRY_RUN === "1" || !serviceKey;
  if (dryRun) {
    return { ok: true, dryRun: true, upserted: 0 };
  }

  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, dryRun: false, upserted: 0, error: "BLACKBOX_API_URL missing." };

  try {
    const res = await fetch(`${base}/api/ledger/claims`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return {
        ok: false,
        dryRun: false,
        upserted: 0,
        error: `BLACKBOX ${res.status}`,
      };
    }
    const data = (await res.json()) as { claims?: BlackboxClaimRow[] };
    const claims = data.claims ?? [];
    let upserted = 0;
    for (const row of claims) {
      const name = splitName(row.primaryClaimant);
      await prisma.claimMirror.upsert({
        where: { blackboxClaimId: row.id },
        create: {
          blackboxClaimId: row.id,
          claimNumber: row.claimNumber,
          status: row.status,
          lossType: row.lossType,
          dateOfLoss: new Date(row.dateOfLoss),
          propertyAddress: row.propertyAddress,
          zipCode: row.zipCode,
          county: row.county,
          lossDescription: row.lossDescription ?? null,
          policyNumber: row.policyNumber ?? null,
          carrierName: row.carrierName ?? null,
          insurerClaimNumber: row.insurerClaimNumber ?? null,
          deskExaminerName: row.deskExaminerName ?? null,
          deskExaminerPhone: row.deskExaminerPhone ?? null,
          deskExaminerEmail: row.deskExaminerEmail ?? null,
          estimatedValue: row.estimatedValue ?? null,
          demandAmount: row.demandAmount ?? null,
          rcvAmount: row.rcvAmount ?? null,
          acvAmount: row.acvAmount ?? null,
          settlementAmount: row.settlementAmount ?? null,
          settlementDate: row.settlementDate ? new Date(row.settlementDate) : null,
          contingencyFeePercent: row.contingencyFeePercent ?? 20,
          isCatClaim: Boolean(row.isCatClaim),
          assignedAdjuster: row.assignedAdjuster ?? null,
          assignedAdjusterLicense: row.assignedAdjusterLicense ?? null,
          claimantFirstName: row.claimantFirstName ?? name.first,
          claimantLastName: row.claimantLastName ?? name.last,
          claimantEmail: row.claimantEmail ?? "",
          claimantPhone: row.claimantPhone ?? "",
          claimantMailing: row.claimantMailing ?? "",
          intakeNumber: row.intakeNumber ?? null,
          syncedAt: new Date(),
        },
        update: {
          claimNumber: row.claimNumber,
          status: row.status,
          lossType: row.lossType,
          dateOfLoss: new Date(row.dateOfLoss),
          propertyAddress: row.propertyAddress,
          zipCode: row.zipCode,
          county: row.county,
          lossDescription: row.lossDescription ?? null,
          policyNumber: row.policyNumber ?? null,
          carrierName: row.carrierName ?? null,
          insurerClaimNumber: row.insurerClaimNumber ?? null,
          estimatedValue: row.estimatedValue ?? null,
          demandAmount: row.demandAmount ?? null,
          rcvAmount: row.rcvAmount ?? null,
          acvAmount: row.acvAmount ?? null,
          settlementAmount: row.settlementAmount ?? null,
          settlementDate: row.settlementDate ? new Date(row.settlementDate) : null,
          contingencyFeePercent: row.contingencyFeePercent ?? 20,
          isCatClaim: Boolean(row.isCatClaim),
          assignedAdjuster: row.assignedAdjuster ?? null,
          assignedAdjusterLicense: row.assignedAdjusterLicense ?? null,
          claimantFirstName: row.claimantFirstName ?? name.first,
          claimantLastName: row.claimantLastName ?? name.last,
          intakeNumber: row.intakeNumber ?? null,
          syncedAt: new Date(),
        },
      });
      upserted += 1;
    }
    return { ok: true, dryRun: false, upserted };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      upserted: 0,
      error: err instanceof Error ? err.message : "BLACKBOX sync failed.",
    };
  }
}

function letterVaultDocType(
  documentType: string
): "DEMAND_LETTER" | "ESTIMATE" | "CORRESPONDENCE" {
  if (documentType === "DEMAND_LETTER") return "DEMAND_LETTER";
  if (documentType === "SCOPE_LETTER") return "ESTIMATE";
  return "CORRESPONDENCE";
}

export async function attachExecutedToBlackbox(opts: {
  claimId: string;
  generatedDocumentId: string;
  documentType: string;
  title: string;
  fileName: string;
  html: string;
  fileUrl?: string | null;
}): Promise<{ ok: boolean; dryRun: boolean; documentId?: string; error?: string }> {
  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  const key =
    process.env.BLACKLETTER_API_KEY?.trim() ||
    process.env.BLACKBOX_API_KEY?.trim();

  if (!base || !key) {
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch(`${base}/api/letter/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        claimId: opts.claimId,
        generatedDocumentId: opts.generatedDocumentId,
        documentType: opts.documentType,
        title: opts.title,
        fileName: opts.fileName,
        html: opts.html,
        fileUrl: opts.fileUrl || undefined,
        mimeType: "text/html; charset=utf-8",
        docType: letterVaultDocType(opts.documentType),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        dryRun: false,
        error: `BLACKBOX vault ${res.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`,
      };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, dryRun: false, documentId: data.id };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "BLACKBOX vault upload failed.",
    };
  }
}
