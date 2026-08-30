import { prisma } from "@/lib/prisma";
import { pullBlackgateOnFile } from "@/lib/integrations/blackgate";
import {
  computeNextDocument,
  mergeExistingFromSources,
  parseStageMapRow,
} from "@/lib/stage-map";
import type { ClaimStatus, NextDocumentResult } from "@/lib/types";

export async function nextDocumentForClaim(opts: {
  claimId?: string;
  claimNumber?: string;
  status?: string;
  aobApplicable?: boolean;
}): Promise<NextDocumentResult | null> {
  const maps = (await prisma.documentStageMap.findMany()).map(parseStageMapRow);

  const claim = opts.claimId
    ? await prisma.claimMirror.findFirst({
        where: {
          OR: [
            { blackboxClaimId: opts.claimId },
            { id: opts.claimId },
          ],
        },
        include: { documents: { select: { documentType: true, status: true } } },
      })
    : opts.claimNumber
      ? await prisma.claimMirror.findUnique({
          where: { claimNumber: opts.claimNumber },
          include: { documents: { select: { documentType: true, status: true } } },
        })
      : null;

  if (claim) {
    const intake = await pullBlackgateOnFile({
      claimMirrorId: claim.id,
      claimNumber: claim.claimNumber,
      intakeNumber: claim.intakeNumber,
    });
    return computeNextDocument({
      claimId: claim.blackboxClaimId,
      claimNumber: claim.claimNumber,
      claimStatus: (opts.status ?? claim.status) as ClaimStatus,
      aobApplicable: opts.aobApplicable ?? claim.aobApplicable,
      maps,
      existing: mergeExistingFromSources({
        generated: claim.documents,
        intake,
      }),
    });
  }

  if (!opts.claimId && !opts.claimNumber) return null;
  if (!opts.status) return null;

  return computeNextDocument({
    claimId: opts.claimId ?? "",
    claimNumber: opts.claimNumber ?? "",
    claimStatus: opts.status as ClaimStatus,
    aobApplicable: opts.aobApplicable,
    maps,
    existing: [],
  });
}
