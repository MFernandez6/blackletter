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

const VAGUE_CANCELLATION = /period required by florida law/i;

/** A street address. "Florida" alone is not a permanent business address. */
export function streetAddressProblem(address: string): string | null {
  const value = address.trim();
  if (!value) return "Firm address is not configured (NEXT_PUBLIC_FIRM_ADDRESS).";
  if (/^florida$/i.test(value)) {
    return 'Firm address cannot be only "Florida". Set NEXT_PUBLIC_FIRM_ADDRESS to the street, city, and ZIP.';
  }
  if (!/\d/.test(value) || value.length < 12 || !/,/.test(value)) {
    return "Firm address must include a street number, city, and ZIP.";
  }
  return null;
}

/** Language problems in the published template, before claim data is merged. */
export function templateLanguageProblems(documentType: DocumentType, body: string): string[] {
  if (documentType !== "PA_CONTRACT" && documentType !== "CLIENT_DISCLOSURE") return [];
  const problems: string[] = [];
  if (!body.includes("{{firm_address}}")) {
    problems.push("Template does not print the firm's street address.");
  }
  if (documentType === "CLIENT_DISCLOSURE" && !body.includes("{{fee_cap_percent}}")) {
    problems.push("Disclosure must state the statutory fee cap.");
  }
  if (documentType !== "PA_CONTRACT") return problems;
  if (!body.includes(FRAUD_WARNING_MARKER)) {
    problems.push("Template is missing the § 817.234 fraud warning.");
  }
  if (VAGUE_CANCELLATION.test(body)) {
    problems.push('Cancellation clause must state the number of days, not "the period required by Florida law".');
  }
  if (!body.includes("{{rescission_terms}}")) {
    problems.push("Cancellation clause must state the 10-day period, and the emergency period when it applies.");
  }
  if (!body.includes("{{fee_cap_percent}}")) {
    problems.push("Fee clause must state the 10% and 20% statutory caps.");
  }
  return problems;
}

/** Returns the reasons a document may not be generated; empty when it may proceed. */
export function contractGateProblems(input: ContractGateInput): string[] {
  if (DISABLED_DOCUMENTS.includes(input.documentType)) {
    return ["This document type is disabled pending Florida counsel review."];
  }
  if (!ENGAGEMENT_DOCUMENTS.includes(input.documentType)) return [];

  const problems: string[] = [...templateLanguageProblems(input.documentType, input.templateBody)];
  const addressProblem = streetAddressProblem(FIRM.address);
  if (addressProblem) problems.push(addressProblem);
  if (!FIRM.phone) problems.push("Firm phone is not configured (NEXT_PUBLIC_FIRM_PHONE).");

  const license = input.adjusterLicense?.trim();
  if (!license || license === "—") {
    problems.push("The assigned adjuster has no license number on file in BLACKBOX.");
  } else if (license.toUpperCase() === "G279764") {
    problems.push(
      "G279764 is a 6-20 license and is blocked on public-adjuster contracts. Put the public-adjuster license on the adjuster in BLACKBOX."
    );
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

  const unresolved = Array.from(
    new Set(Array.from(input.mergedBody.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi), (m) => m[1].toLowerCase()))
  );
  if (unresolved.length > 0) {
    problems.push(`Missing claim data for: ${unresolved.join(", ")}.`);
  }

  return problems;
}
