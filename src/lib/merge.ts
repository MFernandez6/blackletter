import { format } from "date-fns";
import { FIRM } from "@/lib/constants";
import type { MergeValues } from "@/lib/types";

const FIELD_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

export function extractMergeFields(body: string): string[] {
  const found = new Set<string>();
  const re = new RegExp(FIELD_RE.source, FIELD_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    found.add(match[1].toLowerCase());
  }
  return Array.from(found);
}

export function mergeTemplate(body: string, values: MergeValues): string {
  return body.replace(FIELD_RE, (_, key: string) => {
    const value = values[key.toLowerCase()];
    if (value === undefined || value === null || value === "") {
      return `{{${key.toLowerCase()}}}`;
    }
    return value;
  });
}

export function highlightMergeFields(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(FIELD_RE, (_m, key: string) => {
    return `<mark class="merge-field">{{${key.toLowerCase()}}}</mark>`;
  });
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function feeEarned(
  settlement: number | null | undefined,
  percent: number | null | undefined
): number | null {
  if (settlement == null || percent == null) return null;
  return Math.round(settlement * percent) / 100;
}

export type ClaimMergeSource = {
  claimNumber: string;
  insurerClaimNumber?: string | null;
  policyNumber?: string | null;
  carrierName?: string | null;
  dateOfLoss: Date | string;
  propertyAddress: string;
  zipCode: string;
  county: string;
  lossType: string;
  lossDescription?: string | null;
  assignedAdjuster?: string | null;
  assignedAdjusterLicense?: string | null;
  claimantFirstName: string;
  claimantLastName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantMailing: string;
  contingencyFeePercent?: number | null;
  estimatedValue?: number | null;
  demandAmount?: number | null;
  settlementAmount?: number | null;
  settlementDate?: Date | string | null;
  rcvAmount?: number | null;
  acvAmount?: number | null;
  deskExaminerName?: string | null;
  intakeNumber?: string | null;
  scopeSummary?: string | null;
  photoCount?: number | null;
};

export function valuesFromClaim(claim: ClaimMergeSource): MergeValues {
  const first = claim.claimantFirstName.trim();
  const last = claim.claimantLastName.trim();
  const name = `${first} ${last}`.trim();
  const percent = claim.contingencyFeePercent ?? 20;
  const basis =
    claim.settlementAmount ?? claim.demandAmount ?? claim.estimatedValue ?? null;
  const fee = feeEarned(basis, percent);
  const client =
    claim.settlementAmount != null && fee != null
      ? claim.settlementAmount - fee
      : null;
  const dol =
    claim.dateOfLoss instanceof Date
      ? claim.dateOfLoss
      : new Date(claim.dateOfLoss);
  const settled = claim.settlementDate
    ? claim.settlementDate instanceof Date
      ? claim.settlementDate
      : new Date(claim.settlementDate)
    : null;

  return {
    claimant_name: name,
    claimant_first_name: first,
    claimant_last_name: last,
    claimant_email: claim.claimantEmail,
    claimant_phone: claim.claimantPhone,
    claimant_mailing_address: claim.claimantMailing,
    claim_number: claim.claimNumber,
    insurer_claim_number: claim.insurerClaimNumber || "Pending",
    policy_number: claim.policyNumber || "Unknown",
    carrier_name: claim.carrierName || "Unknown carrier",
    date_of_loss: format(dol, "MMMM d, yyyy"),
    property_address: claim.propertyAddress,
    zip_code: claim.zipCode,
    county: claim.county,
    loss_type: claim.lossType.replaceAll("_", " "),
    loss_description: claim.lossDescription || "—",
    adjuster_name: claim.assignedAdjuster || "Staff public adjuster",
    adjuster_license: claim.assignedAdjusterLicense || "—",
    firm_name: FIRM.legalName,
    firm_address: FIRM.address,
    firm_phone: FIRM.phone,
    firm_email: FIRM.email,
    contingency_fee_percent: `${percent}%`,
    estimated_value: money(claim.estimatedValue),
    demand_amount: money(claim.demandAmount),
    settlement_amount: money(claim.settlementAmount),
    settlement_date: settled ? format(settled, "MMMM d, yyyy") : "—",
    rcv_amount: money(claim.rcvAmount),
    acv_amount: money(claim.acvAmount),
    fee_earned: money(fee),
    client_disbursement: money(client),
    desk_examiner_name: claim.deskExaminerName || "Claims Department",
    today: format(new Date(), "MMMM d, yyyy"),
    scope_summary: claim.scopeSummary || "Scope pending from BLACKMIRROR.",
    photo_count:
      claim.photoCount != null ? String(claim.photoCount) : "0",
    intake_number: claim.intakeNumber || "—",
  };
}

export function missingMergeFields(body: string, values: MergeValues): string[] {
  return extractMergeFields(body).filter((key) => {
    const v = values[key];
    return !v || v === "—" || v === "Unknown" || v === "Unknown carrier" || v === "Pending";
  });
}
