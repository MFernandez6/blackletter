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

export async function pullBlackboxClaims(): Promise<{
  ok: boolean;
  dryRun: boolean;
  upserted: number;
  error?: string;
}> {
  const dryRun =
    process.env.BLACKBOX_DRY_RUN === "1" || !process.env.BLACKBOX_API_KEY;
  if (dryRun) {
    return { ok: true, dryRun: true, upserted: 0 };
  }

  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, dryRun: false, upserted: 0, error: "BLACKBOX_API_URL missing." };

  try {
    const res = await fetch(`${base}/api/ledger/claims`, {
      headers: {
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
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

export async function attachExecutedToBlackbox(opts: {
  claimId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}): Promise<{ ok: boolean; dryRun: boolean; error?: string }> {
  if (process.env.BLACKBOX_DRY_RUN === "1" || !process.env.BLACKBOX_API_KEY) {
    return { ok: true, dryRun: true };
  }
  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, dryRun: false, error: "BLACKBOX_API_URL missing." };

  try {
    const res = await fetch(`${base}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
      },
      body: JSON.stringify({
        claimId: opts.claimId,
        fileName: opts.fileName,
        fileUrl: opts.fileUrl,
        mimeType: opts.mimeType,
        docType: "CORRESPONDENCE",
        source: "BLACKLETTER",
      }),
    });
    if (!res.ok) {
      return { ok: false, dryRun: false, error: `BLACKBOX upload ${res.status}` };
    }
    return { ok: true, dryRun: false };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "BLACKBOX upload failed.",
    };
  }
}
