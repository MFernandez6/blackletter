import type { ClaimStatus, DocumentType, LifecycleStage } from "@/lib/types";

export const FIRM = {
  name: "Blackline Public Adjusters LLC",
  legalName: "BLACKLINE PUBLIC ADJUSTERS LLC",
  address: "Florida",
  phone: "(800) 000-0000",
  email: "files@blacklineadjusting.com",
  website: "blacklineadjusting.com",
  statuteCite: "Fla. Stat. § 626.854",
  mediationCite: "Fla. Stat. § 627.7015",
} as const;

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  INTAKE_ENGAGEMENT: "Intake / engagement",
  NOTICE_FILING: "Notice / filing",
  NEGOTIATION: "Negotiation",
  RESOLUTION: "Resolution",
  ADMINISTRATIVE: "Administrative",
};

export const STAGE_BLURB: Record<LifecycleStage, string> = {
  INTAKE_ENGAGEMENT: "Representation, fee agreement, UPL disclosure, AOB.",
  NOTICE_FILING: "Carrier notice, proof of loss, and preliminary scope.",
  NEGOTIATION: "Demand, supplement, EUO, appraisal, and mediation.",
  RESOLUTION: "Release, closing statement, and contingency invoice.",
  ADMINISTRATIVE: "Extensions, withdrawal, and client status letters.",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  LOR: "Letter of Representation",
  PA_CONTRACT: "PA Contract of Employment",
  CLIENT_DISCLOSURE: "Client / engagement disclosure",
  AOB: "Assignment of Benefits",
  NOTICE_OF_CLAIM: "Notice of Claim / Representation",
  PROOF_OF_LOSS: "Sworn Statement in Proof of Loss",
  SCOPE_LETTER: "Preliminary damage estimate / scope letter",
  DEMAND_LETTER: "Demand letter / Reservation of Rights response",
  SUPPLEMENTAL: "Supplemental claim submission",
  EUO_LETTER: "EUO response / prep letter",
  APPRAISAL_DEMAND: "Appraisal demand letter",
  MEDIATION_REQUEST: "Mediation request",
  SETTLEMENT_AGREEMENT: "Settlement agreement / Release of all claims",
  FULL_FINAL_RELEASE: "Full and Final Release",
  CLOSING_STATEMENT: "Closing statement / disbursement breakdown",
  FEE_INVOICE: "Contingency fee invoice",
  EXTENSION_REQUEST: "Extension request letter",
  WITHDRAWAL: "Withdrawal of representation",
  STATUS_UPDATE: "Client status update",
};

export const DOCUMENT_TYPE_BLURB: Record<DocumentType, string> = {
  LOR: "Notifies the carrier that Blackline is the insured's public adjuster of record.",
  PA_CONTRACT: "Contingency fee agreement under Florida public-adjuster rules.",
  CLIENT_DISCLOSURE: "UPL-compliant engagement disclosure — not legal advice, not counsel.",
  AOB: "Assignment of benefits, only when the claim type and carrier allow it.",
  NOTICE_OF_CLAIM: "Formal notice of claim and representation to the carrier.",
  PROOF_OF_LOSS: "Sworn proof of loss for the named insured.",
  SCOPE_LETTER: "Paired with the BLACKMIRROR photo report and preliminary scope.",
  DEMAND_LETTER: "Demand package or response to a reservation-of-rights letter.",
  SUPPLEMENTAL: "Additional damages discovered after the original submission.",
  EUO_LETTER: "Preparation letter ahead of an Examination Under Oath.",
  APPRAISAL_DEMAND: "Invokes the policy appraisal clause.",
  MEDIATION_REQUEST: "Florida statutory mediation request (property).",
  SETTLEMENT_AGREEMENT: "Settlement and release — triggers BLACKLEDGER payout.",
  FULL_FINAL_RELEASE: "Property full-and-final release — triggers BLACKLEDGER payout.",
  CLOSING_STATEMENT: "Client-facing fee and disbursement breakdown.",
  FEE_INVOICE: "Contingency invoice tied to the BLACKLEDGER payout record.",
  EXTENSION_REQUEST: "Request additional time from the carrier or insured.",
  WITHDRAWAL: "Withdraws representation if the file is dropped.",
  STATUS_UPDATE: "Periodic non-legal correspondence to the client.",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  INTAKE: "Intake",
  UNDER_REVIEW: "Under review",
  INVESTIGATION: "Investigation",
  FILED: "Filed",
  NEGOTIATING: "Negotiating",
  SETTLED: "Settled",
  CLOSED: "Closed",
  DENIED: "Denied",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Awaiting signature",
  signed: "Signed",
  executed: "Executed",
};

export const STAGE_ORDER: LifecycleStage[] = [
  "INTAKE_ENGAGEMENT",
  "NOTICE_FILING",
  "NEGOTIATION",
  "RESOLUTION",
  "ADMINISTRATIVE",
];

/** Which lifecycle stages are "due" given a BLACKBOX claim status. */
export const STAGES_FOR_STATUS: Record<ClaimStatus, LifecycleStage[]> = {
  INTAKE: ["INTAKE_ENGAGEMENT"],
  UNDER_REVIEW: ["INTAKE_ENGAGEMENT"],
  INVESTIGATION: ["INTAKE_ENGAGEMENT", "NOTICE_FILING"],
  FILED: ["INTAKE_ENGAGEMENT", "NOTICE_FILING"],
  NEGOTIATING: ["INTAKE_ENGAGEMENT", "NOTICE_FILING", "NEGOTIATION"],
  DENIED: ["INTAKE_ENGAGEMENT", "NOTICE_FILING", "NEGOTIATION"],
  SETTLED: [
    "INTAKE_ENGAGEMENT",
    "NOTICE_FILING",
    "NEGOTIATION",
    "RESOLUTION",
  ],
  CLOSED: [
    "INTAKE_ENGAGEMENT",
    "NOTICE_FILING",
    "NEGOTIATION",
    "RESOLUTION",
  ],
};

export const TRIGGERS_LEDGER_PAYOUT: DocumentType[] = [
  "SETTLEMENT_AGREEMENT",
  "FULL_FINAL_RELEASE",
];

export const MERGE_FIELD_HELP: Record<string, string> = {
  claimant_name: "Primary insured full name",
  claimant_first_name: "Primary insured first name",
  claimant_last_name: "Primary insured last name",
  claimant_email: "Primary insured email",
  claimant_phone: "Primary insured phone",
  claimant_mailing_address: "Primary insured mailing address",
  claim_number: "Blackline claim number (BL-YY-####)",
  insurer_claim_number: "Carrier / NI claim number",
  policy_number: "Policy number",
  carrier_name: "Insurance carrier",
  date_of_loss: "Date of loss",
  property_address: "Loss location",
  zip_code: "ZIP",
  county: "County",
  loss_type: "Cause of loss",
  loss_description: "Loss narrative",
  adjuster_name: "Assigned public adjuster",
  adjuster_license: "PA license number",
  firm_name: "Firm legal name",
  firm_address: "Firm address",
  firm_phone: "Firm phone",
  firm_email: "Firm email",
  contingency_fee_percent: "Contracted contingency %",
  estimated_value: "Estimated value",
  demand_amount: "Demand amount",
  settlement_amount: "Settlement amount",
  settlement_date: "Settlement date",
  rcv_amount: "Replacement cost value",
  acv_amount: "Actual cash value",
  fee_earned: "Contingency fee dollars",
  client_disbursement: "Net to client",
  desk_examiner_name: "Carrier desk examiner",
  today: "Today's date",
  scope_summary: "BLACKMIRROR scope summary",
  photo_count: "BLACKMIRROR photo count",
  intake_number: "BLACKGATE intake number",
};
