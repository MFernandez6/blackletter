import { FIRM } from "@/lib/constants";
import {
  computeFeeCap,
  RESCISSION_DAYS_AFTER_EXECUTION,
  RESCISSION_DAYS_AFTER_LOSS_EMERGENCY,
} from "@/lib/compliance/florida-pa";
import type { DocumentType } from "@/lib/types";

/** Client-facing engagement documents that must meet Florida PA contract rules. */
export const ENGAGEMENT_DOCUMENTS: DocumentType[] = ["PA_CONTRACT", "CLIENT_DISCLOSURE", "AOB"];

/** Disabled until Florida counsel confirms a PA may take an assignment of benefits. */
export const DISABLED_DOCUMENTS: DocumentType[] = ["AOB"];

/** Statutory fraud statement marker (Fla. Stat. § 817.234) required in the PA contract. */
export const FRAUD_WARNING_MARKER = "817.234";

export type ContractGateInput = {
  documentType: DocumentType;
  templateBody: string;
  mergedBody: string;
  contingencyFeePercent: number | null | undefined;
  isEmergencyLoss: boolean;
  adjusterLicense: string | null | undefined;
};

export function feeCapFor(isEmergencyLoss: boolean) {
  return computeFeeCap({ isEmergencyLoss });
}

export function rescissionTerms(isEmergencyLoss: boolean): string {
  return isEmergencyLoss
    ? `within ${RESCISSION_DAYS_AFTER_EXECUTION} days after this contract is executed, or within ${RESCISSION_DAYS_AFTER_LOSS_EMERGENCY} days after the date of loss, whichever is later`
    : `within ${RESCISSION_DAYS_AFTER_EXECUTION} days after this contract is executed`;
}

/** Returns the reasons a document may not be generated; empty when it may proceed. */
export function contractGateProblems(input: ContractGateInput): string[] {
  if (DISABLED_DOCUMENTS.includes(input.documentType)) {
    return ["This document type is disabled pending Florida counsel review."];
  }
  if (!ENGAGEMENT_DOCUMENTS.includes(input.documentType)) return [];

  const problems: string[] = [];
  if (!FIRM.address) problems.push("Firm address is not configured (NEXT_PUBLIC_FIRM_ADDRESS).");
  if (!FIRM.phone) problems.push("Firm phone is not configured (NEXT_PUBLIC_FIRM_PHONE).");

  const license = input.adjusterLicense?.trim();
  if (!license || license === "—") {
    problems.push("The assigned adjuster has no license number on file in BLACKBOX.");
  }

  const percent = input.contingencyFeePercent;
  const cap = feeCapFor(input.isEmergencyLoss);
  if (percent == null || !Number.isFinite(percent) || percent <= 0) {
    problems.push("The claim has no contingency fee percentage.");
  } else if (percent > cap.capPercent) {
    problems.push(
      `Contingency fee ${percent}% exceeds the ${cap.capPercent}% cap (${cap.basis}, ${cap.cite}). Correct the fee in BLACKBOX.`
    );
  }

  if (input.documentType === "PA_CONTRACT" && !input.templateBody.includes(FRAUD_WARNING_MARKER)) {
    problems.push("The published PA contract template is missing the § 817.234 fraud warning.");
  }

  const unresolved = Array.from(
    new Set(Array.from(input.mergedBody.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi), (m) => m[1].toLowerCase()))
  );
  if (unresolved.length > 0) {
    problems.push(`Missing claim data for: ${unresolved.join(", ")}.`);
  }

  return problems;
}
