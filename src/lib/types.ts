export const STAFF_ROLES = ["ADMIN", "ADJUSTER", "VIEWER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const CLAIM_STATUSES = [
  "INTAKE",
  "UNDER_REVIEW",
  "INVESTIGATION",
  "FILED",
  "NEGOTIATING",
  "SETTLED",
  "CLOSED",
  "DENIED",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const LIFECYCLE_STAGES = [
  "INTAKE_ENGAGEMENT",
  "NOTICE_FILING",
  "NEGOTIATION",
  "RESOLUTION",
  "ADMINISTRATIVE",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const DOCUMENT_TYPES = [
  "LOR",
  "PA_CONTRACT",
  "CLIENT_DISCLOSURE",
  "AOB",
  "NOTICE_OF_CLAIM",
  "PROOF_OF_LOSS",
  "SCOPE_LETTER",
  "DEMAND_LETTER",
  "SUPPLEMENTAL",
  "EUO_LETTER",
  "APPRAISAL_DEMAND",
  "MEDIATION_REQUEST",
  "SETTLEMENT_AGREEMENT",
  "FULL_FINAL_RELEASE",
  "CLOSING_STATEMENT",
  "FEE_INVOICE",
  "EXTENSION_REQUEST",
  "WITHDRAWAL",
  "STATUS_UPDATE",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = ["draft", "sent", "signed", "executed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const SIGNATURE_STATUSES = [
  "created",
  "sent",
  "viewed",
  "signed",
  "completed",
  "declined",
  "error",
] as const;
export type SignatureStatus = (typeof SIGNATURE_STATUSES)[number];

export const SATISFIED_STATUSES: DocumentStatus[] = ["signed", "executed"];

export type IntakeOnFile = {
  documentType: DocumentType;
  status: DocumentStatus;
  fileUrl?: string | null;
  source?: "BLACKGATE" | "BLACKLETTER";
};

export type MirrorScope = {
  photoCount?: number;
  scopeSummary?: string;
  reportUrl?: string | null;
};

export type NextDocumentItem = {
  documentType: DocumentType;
  name: string;
  stage: LifecycleStage;
  required: boolean;
  reason: string;
  alreadyOnFile: boolean;
  onFileSource: "BLACKGATE" | "BLACKLETTER" | null;
  onFileStatus: DocumentStatus | null;
};

export type NextDocumentResult = {
  claimId: string;
  claimNumber: string;
  claimStatus: ClaimStatus;
  next: NextDocumentItem | null;
  due: NextDocumentItem[];
  complete: boolean;
};

export type MergeValues = Record<string, string>;
