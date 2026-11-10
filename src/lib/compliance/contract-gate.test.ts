import { describe, expect, it, vi } from "vitest";
import { contractGateProblems, rescissionTerms } from "./contract-gate";
import { PA_CONTRACT_BODY } from "@/lib/templates/catalog";
import { mergeTemplate, valuesFromClaim } from "@/lib/merge";

vi.mock("@/lib/constants", () => ({
  FIRM: { legalName: "BLACKLINE PUBLIC ADJUSTERS LLC", address: "100 Main St, Miami, FL 33101", phone: "(305) 555-0100", email: "", website: "" },
}));


const claim = {
  claimNumber: "BL-26-0001",
  dateOfLoss: "2026-06-01",
  propertyAddress: "1 Ocean Dr",
  zipCode: "33139",
  county: "Miami-Dade",
  lossType: "WATER",
  policyNumber: "P-1",
  carrierName: "Carrier",
  insurerClaimNumber: "C-1",
  assignedAdjuster: "Miguel Fernandez",
  assignedAdjusterLicense: "W100001",
  claimantFirstName: "Ana",
  claimantLastName: "Diaz",
  claimantEmail: "ana@example.com",
  claimantPhone: "3055550101",
  claimantMailing: "1 Ocean Dr, Miami Beach, FL 33139",
};

function gate(overrides: Partial<typeof claim & { contingencyFeePercent: number; isCatClaim: boolean }>) {
  const source = { contingencyFeePercent: 20, isCatClaim: false, ...claim, ...overrides };
  return contractGateProblems({
    documentType: "PA_CONTRACT",
    templateBody: PA_CONTRACT_BODY,
    mergedBody: mergeTemplate(PA_CONTRACT_BODY, valuesFromClaim(source)),
    contingencyFeePercent: source.contingencyFeePercent,
    isEmergencyLoss: source.isCatClaim,
    adjusterLicense: source.assignedAdjusterLicense,
  });
}

describe("contract gate", () => {
  it("allows a complete standard contract at 20%", () => {
    expect(gate({})).toEqual([]);
  });

  it("blocks a fee above the emergency cap", () => {
    expect(gate({ isCatClaim: true, contingencyFeePercent: 20 }).join(" ")).toMatch(/exceeds the 10% cap/);
    expect(gate({ isCatClaim: true, contingencyFeePercent: 10 })).toEqual([]);
  });

  it("blocks a fee above 20% on a standard claim", () => {
    expect(gate({ contingencyFeePercent: 25 }).join(" ")).toMatch(/exceeds the 20% cap/);
  });

  it("blocks a missing license", () => {
    expect(gate({ assignedAdjusterLicense: "" }).join(" ")).toMatch(/license/);
  });

  it("blocks the 6-20 license on a public-adjuster contract", () => {
    expect(gate({ assignedAdjusterLicense: "G279764" }).join(" ")).toMatch(/blocked/);
  });

  it("blocks a template without the fraud warning", () => {
    const body = PA_CONTRACT_BODY.replace(/FRAUD WARNING[\s\S]*Florida Statutes\.\n/, "");
    const problems = contractGateProblems({
      documentType: "PA_CONTRACT",
      templateBody: body,
      mergedBody: body,
      contingencyFeePercent: 20,
      isEmergencyLoss: false,
      adjusterLicense: "W1",
    });
    expect(problems.join(" ")).toMatch(/817\.234/);
  });

  it("blocks unresolved merge fields", () => {
    expect(gate({ policyNumber: "" }).join(" ")).not.toMatch(/policy_number/);
    expect(gate({ claimantEmail: "" }).join(" ")).toMatch(/claimant_email/);
  });

  it("disables AOB and leaves letters alone", () => {
    const base = { templateBody: "x", mergedBody: "{{x}}", contingencyFeePercent: 50, isEmergencyLoss: false, adjusterLicense: null };
    expect(contractGateProblems({ ...base, documentType: "AOB" })[0]).toMatch(/disabled/);
    expect(contractGateProblems({ ...base, documentType: "STATUS_UPDATE" })).toEqual([]);
  });

  it("prints the longer emergency rescission window", () => {
    expect(rescissionTerms(true)).toMatch(/30 days after the date of loss/);
    expect(rescissionTerms(false)).not.toMatch(/30 days/);
  });
});
