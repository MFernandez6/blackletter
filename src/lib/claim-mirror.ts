import { prisma } from "@/lib/prisma";
import { pullBlackboxClaims } from "@/lib/integrations/blackbox";

type ClaimMirrorInclude = {
  documents: {
    orderBy: { generatedAt: "asc" };
    include: {
      templateVersion: { select: { version: true } };
      generatedBy: { select: { name: true } };
      signatureRequests: { orderBy: { createdAt: "desc" }; take: 1 };
    };
  };
};

const claimMirrorInclude = {
  documents: {
    orderBy: { generatedAt: "asc" as const },
    include: {
      templateVersion: { select: { version: true } },
      generatedBy: { select: { name: true } },
      signatureRequests: { orderBy: { createdAt: "desc" as const }, take: 1 },
    },
  },
} satisfies ClaimMirrorInclude;

function claimMirrorWhere(ref: string, boxId?: string) {
  return {
    OR: [
      { id: ref },
      { blackboxClaimId: ref },
      { claimNumber: ref },
      ...(boxId ? [{ id: boxId }, { blackboxClaimId: boxId }] : []),
    ],
  };
}

/** Resolve a mirrored claim; pull from BLACKBOX once when opened from a deep link. */
export async function findClaimMirror(opts: {
  ref: string;
  boxId?: string;
  syncOnMiss?: boolean;
}) {
  const where = claimMirrorWhere(opts.ref, opts.boxId);
  let claim = await prisma.claimMirror.findFirst({
    where,
    include: claimMirrorInclude,
  });
  if (claim || opts.syncOnMiss === false) return claim;

  const sync = await pullBlackboxClaims();
  if (!sync.ok || sync.dryRun) return claim;

  claim = await prisma.claimMirror.findFirst({
    where,
    include: claimMirrorInclude,
  });
  return claim;
}
