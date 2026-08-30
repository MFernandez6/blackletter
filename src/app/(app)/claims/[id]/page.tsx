import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { nextDocumentForClaim } from "@/lib/next-document";
import { DOCUMENT_TYPE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { parseJson } from "@/lib/utils";
import type { DocumentType, IntakeOnFile, MirrorScope } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ClaimStatusBadge, DocStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ClaimTimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const claim = await prisma.claimMirror.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        orderBy: { generatedAt: "asc" },
        include: {
          templateVersion: { select: { version: true } },
          generatedBy: { select: { name: true } },
          signatureRequests: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!claim) notFound();

  const suggestion = await nextDocumentForClaim({
    claimId: claim.blackboxClaimId,
    status: claim.status,
    aobApplicable: claim.aobApplicable,
  });
  const intake = parseJson<IntakeOnFile[]>(claim.intakeDocumentsJson, []);
  const scope = parseJson<MirrorScope>(claim.mirrorScopeJson, {});
  const blackboxUrl = process.env.NEXT_PUBLIC_BLACKBOX_URL?.replace(/\/$/, "");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Document timeline</p>
          <div className="mt-2 flex flex-wrap items-end gap-4">
            <h1 className="font-serif text-2xl tracking-[0.08em] text-brand-white">
              {claim.claimantFirstName} {claim.claimantLastName}
            </h1>
            <p className="font-mono text-brand-letter-soft">{claim.claimNumber}</p>
            <ClaimStatusBadge status={claim.status} />
          </div>
          <p className="mt-2 text-sm text-brand-white/70">
            {claim.propertyAddress} · {claim.lossType.replaceAll("_", " ")} · DOL{" "}
            {format(claim.dateOfLoss, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blackboxUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={`${blackboxUrl}/claims/${claim.blackboxClaimId}`}>
                Open in BLACKBOX
              </a>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="solid">
            <Link href={`/generate/${claim.id}`}>Generate</Link>
          </Button>
        </div>
      </div>

      {suggestion?.next ? (
        <div className="border border-brand-letter/40 bg-brand-letter/10 px-4 py-4">
          <p className="eyebrow">Due next</p>
          <p className="mt-2 font-serif text-lg text-brand-white">{suggestion.next.name}</p>
          <p className="mt-1 text-sm text-brand-white/70">{suggestion.next.reason}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="border border-brand-white/10 p-4 lg:col-span-2">
          <p className="eyebrow mb-4">BLACKLETTER trail</p>
          {claim.documents.length === 0 ? (
            <p className="text-sm text-brand-slate">No documents generated on this file yet.</p>
          ) : (
            <ol className="relative space-y-0 border-l border-brand-letter/30 pl-6">
              {claim.documents.map((d) => (
                <li key={d.id} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 border border-brand-letter bg-brand-navy" />
                  <Link href={`/documents/${d.id}`} className="block hover:bg-brand-white/5 -mx-2 px-2 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-brand-white">
                        {DOCUMENT_TYPE_LABELS[d.documentType as DocumentType] ?? d.title}
                      </p>
                      <DocStatusBadge status={d.status} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-brand-slate">
                      {format(d.generatedAt, "MMM d, yyyy p")} · v{d.templateVersion.version} ·{" "}
                      {d.generatedBy.name}
                      {d.signatureRequests[0]
                        ? ` · ${d.signatureRequests[0].provider === "google_workspace" ? "Google Docs" : "Signature"} ${d.signatureRequests[0].status}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-brand-white/10 p-4">
            <p className="eyebrow mb-3">Already on file (BLACKGATE)</p>
            {intake.length === 0 ? (
              <p className="text-sm text-brand-slate">
                No intake originals cached. Sync or generate will not replace a
                signed LOR collected at the gate.
              </p>
            ) : (
              <ul className="space-y-2">
                {intake.map((row) => (
                  <li key={row.documentType} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-brand-white">
                      {DOCUMENT_TYPE_LABELS[row.documentType]}
                    </span>
                    <DocStatusBadge status={row.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border border-brand-white/10 p-4">
            <p className="eyebrow mb-3">BLACKMIRROR scope</p>
            <p className="text-sm text-brand-white/80">
              {scope.photoCount ?? 0} photographs
            </p>
            <p className="mt-2 text-sm text-brand-slate">
              {scope.scopeSummary || "No inspection scope cached."}
            </p>
          </div>
          <div className="border border-brand-white/10 p-4">
            <p className="eyebrow mb-3">Stage map</p>
            <ul className="space-y-2 text-sm">
              {suggestion?.due.map((d) => (
                <li key={d.documentType} className="flex justify-between gap-2">
                  <span className={d.alreadyOnFile ? "text-brand-slate" : "text-brand-white"}>
                    {d.name}
                  </span>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-brand-slate">
                    {d.alreadyOnFile ? "on file" : STAGE_LABELS[d.stage]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
