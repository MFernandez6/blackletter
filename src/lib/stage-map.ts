/**
 * Suite-wide "what document does this claim need next?"
 *
 * Lives in BLACKLETTER so BLACKBOX claim detail (and any other product)
 * can call GET /api/next-document instead of embedding this logic.
 *
 * A document is satisfied when BLACKLETTER has it signed/executed, or
 * BLACKGATE already collected it at intake (e.g. a signed LOR).
 */

import {
  DOCUMENT_TYPE_LABELS,
  STAGE_LABELS,
  STAGES_FOR_STATUS,
} from "@/lib/constants";
import type {
  ClaimStatus,
  DocumentStatus,
  DocumentType,
  IntakeOnFile,
  LifecycleStage,
  NextDocumentItem,
  NextDocumentResult,
} from "@/lib/types";
import { SATISFIED_STATUSES } from "@/lib/types";

export type StageMapRow = {
  documentType: DocumentType;
  stage: LifecycleStage;
  claimStatuses: ClaimStatus[];
  sortOrder: number;
  required: boolean;
  aobOnly: boolean;
};

export type ExistingDoc = {
  documentType: DocumentType;
  status: DocumentStatus;
  source: "BLACKLETTER" | "BLACKGATE";
};

export type NextDocumentInput = {
  claimId: string;
  claimNumber: string;
  claimStatus: ClaimStatus;
  aobApplicable?: boolean;
  maps: StageMapRow[];
  existing: ExistingDoc[];
};

function isSatisfied(status: DocumentStatus): boolean {
  return SATISFIED_STATUSES.includes(status);
}

function bestExisting(
  type: DocumentType,
  existing: ExistingDoc[]
): ExistingDoc | undefined {
  const rows = existing.filter((e) => e.documentType === type);
  return (
    rows.find((r) => r.status === "executed") ??
    rows.find((r) => r.status === "signed") ??
    rows.find((r) => r.status === "sent") ??
    rows[0]
  );
}

function reasonFor(row: StageMapRow, claimStatus: ClaimStatus): string {
  if (row.aobOnly) {
    return "AOB applies to this claim type — generate only if assignment is in play.";
  }
  if (row.required) {
    return `Required at ${STAGE_LABELS[row.stage].toLowerCase()} while the file is ${claimStatus.replaceAll("_", " ").toLowerCase()}.`;
  }
  return `Available at ${STAGE_LABELS[row.stage].toLowerCase()}.`;
}

export function mergeExistingFromSources(opts: {
  generated: Array<{ documentType: string; status: string }>;
  intake: IntakeOnFile[];
}): ExistingDoc[] {
  const out: ExistingDoc[] = [];
  for (const row of opts.generated) {
    out.push({
      documentType: row.documentType as DocumentType,
      status: row.status as DocumentStatus,
      source: "BLACKLETTER",
    });
  }
  for (const row of opts.intake) {
    out.push({
      documentType: row.documentType,
      status: row.status,
      source: "BLACKGATE",
    });
  }
  return out;
}

/**
 * Pure function — no I/O. BLACKBOX can send claim status + on-file docs
 * and receive the same suggestion the generate flow uses.
 */
export function computeNextDocument(input: NextDocumentInput): NextDocumentResult {
  const dueStages = STAGES_FOR_STATUS[input.claimStatus] ?? ["INTAKE_ENGAGEMENT"];
  const aob = Boolean(input.aobApplicable);

  const candidates = input.maps
    .filter((row) => {
      if (row.stage === "ADMINISTRATIVE") return false;
      if (row.aobOnly && !aob) return false;
      if (!dueStages.includes(row.stage)) return false;
      return true;
    })
    .sort((a, b) => {
      const sa = dueStages.indexOf(a.stage);
      const sb = dueStages.indexOf(b.stage);
      if (sa !== sb) return sa - sb;
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  const due: NextDocumentItem[] = candidates.map((row) => {
    const found = bestExisting(row.documentType, input.existing);
    const onFile = Boolean(found && isSatisfied(found.status));
    return {
      documentType: row.documentType,
      name: DOCUMENT_TYPE_LABELS[row.documentType],
      stage: row.stage,
      required: row.required,
      reason: reasonFor(row, input.claimStatus),
      alreadyOnFile: onFile,
      onFileSource: found && onFile ? found.source : found ? found.source : null,
      onFileStatus: found?.status ?? null,
    };
  });

  const next =
    due.find((d) => d.required && !d.alreadyOnFile) ??
    due.find((d) => !d.alreadyOnFile) ??
    null;

  const requiredRemaining = due.filter((d) => d.required && !d.alreadyOnFile);

  return {
    claimId: input.claimId,
    claimNumber: input.claimNumber,
    claimStatus: input.claimStatus,
    next,
    due,
    complete: requiredRemaining.length === 0,
  };
}

export function parseStageMapRow(row: {
  documentType: string;
  stage: string;
  claimStatusesJson: string;
  sortOrder: number;
  required: boolean;
  aobOnly: boolean;
}): StageMapRow {
  let statuses: ClaimStatus[] = [];
  try {
    statuses = JSON.parse(row.claimStatusesJson) as ClaimStatus[];
  } catch {
    statuses = [];
  }
  return {
    documentType: row.documentType as DocumentType,
    stage: row.stage as LifecycleStage,
    claimStatuses: statuses,
    sortOrder: row.sortOrder,
    required: row.required,
    aobOnly: row.aobOnly,
  };
}
