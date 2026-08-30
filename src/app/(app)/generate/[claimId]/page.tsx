import { notFound } from "next/navigation";
import { getSession, canEdit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextDocumentForClaim } from "@/lib/next-document";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { mergeTemplate, missingMergeFields, valuesFromClaim } from "@/lib/merge";
import { parseJson } from "@/lib/utils";
import type { DocumentType, MirrorScope } from "@/lib/types";
import { GenerateFlow } from "@/components/generate-flow";
import { ClaimStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function GenerateClaimPage({
  params,
}: {
  params: { claimId: string };
}) {
  const session = await getSession();
  const claim = await prisma.claimMirror.findUnique({
    where: { id: params.claimId },
  });
  if (!claim) notFound();

  const suggestion = await nextDocumentForClaim({
    claimId: claim.blackboxClaimId,
    status: claim.status,
    aobApplicable: claim.aobApplicable,
  });
  if (!suggestion) notFound();

  const templates = await prisma.documentTemplate.findMany({
    where: { isActive: true },
    include: { currentVersion: true },
    orderBy: { name: "asc" },
  });

  const scope = parseJson<MirrorScope>(claim.mirrorScopeJson, {});
  const values = valuesFromClaim({
    ...claim,
    scopeSummary: scope.scopeSummary ?? null,
    photoCount: scope.photoCount ?? null,
  });

  const previews = templates
    .filter((t) => t.currentVersion)
    .map((t) => {
      const body = mergeTemplate(t.currentVersion!.body, values);
      return {
        documentType: t.documentType as DocumentType,
        title: `${DOCUMENT_TYPE_LABELS[t.documentType as DocumentType]} — ${claim.claimNumber}`,
        body,
        missing: missingMergeFields(t.currentVersion!.body, values),
      };
    });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Generate · preview · Google Workspace</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <h1 className="font-serif text-2xl tracking-[0.08em] text-brand-white">
            {claim.claimantFirstName} {claim.claimantLastName}
          </h1>
          <p className="font-mono text-brand-letter-soft">{claim.claimNumber}</p>
          <ClaimStatusBadge status={claim.status} />
        </div>
        <p className="mt-2 text-sm text-brand-white/70">
          {claim.propertyAddress} · {claim.carrierName ?? "Carrier pending"} ·{" "}
          {claim.lossType.replaceAll("_", " ")}
        </p>
      </div>

      <GenerateFlow
        claimId={claim.id}
        claimNumber={claim.claimNumber}
        suggestion={suggestion}
        previews={previews}
        canWrite={session ? canEdit(session.user.role) : false}
      />
    </div>
  );
}
