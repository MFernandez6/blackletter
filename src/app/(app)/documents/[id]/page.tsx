import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getSession, canEdit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocPreview } from "@/components/doc-preview";
import { DocumentActions } from "@/components/document-actions";
import { ClaimStatusBadge, DocStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const doc = await prisma.generatedDocument.findUnique({
    where: { id: params.id },
    include: {
      claim: true,
      template: true,
      templateVersion: true,
      generatedBy: { select: { name: true } },
      signatureRequests: {
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { receivedAt: "desc" }, take: 8 } },
      },
    },
  });
  if (!doc) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/claims/${doc.claimMirrorId}`}
            className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-letter-soft"
          >
            Claim timeline
          </Link>
          <h1 className="mt-3 font-serif text-2xl tracking-[0.08em] text-brand-white">
            {doc.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-mono text-sm text-brand-letter-soft">{doc.claimNumber}</p>
            <DocStatusBadge status={doc.status} />
            <ClaimStatusBadge status={doc.claim.status} />
          </div>
          <p className="mt-2 text-sm text-brand-slate">
            Template {doc.template.documentType} v{doc.templateVersion.version} · generated{" "}
            {format(doc.generatedAt, "MMM d, yyyy p")} by {doc.generatedBy.name}
          </p>
          {doc.ledgerPayoutId ? (
            <p className="mt-2 text-sm text-brand-letter-soft">
              BLACKLEDGER payout {doc.ledgerPayoutId}
            </p>
          ) : null}
        </div>
        <DocumentActions
          documentId={doc.id}
          status={doc.status}
          canWrite={session ? canEdit(session.user.role) : false}
        />
      </div>

      {doc.signatureRequests.length > 0 ? (
        <section className="border border-brand-white/10 p-4">
          <p className="eyebrow mb-3">SignWell</p>
          {doc.signatureRequests.map((r) => (
            <div key={r.id} className="text-sm text-brand-white/80">
              <p>
                {r.recipientName} · {r.recipientEmail} · {r.status}
                {r.testMode ? " · test/dry-run" : ""}
              </p>
              {r.events.map((e) => (
                <p key={e.id} className="font-mono text-xs text-brand-slate">
                  {format(e.receivedAt, "MMM d p")} · {e.eventType}
                </p>
              ))}
            </div>
          ))}
        </section>
      ) : null}

      <DocPreview body={doc.mergedBody} />
    </div>
  );
}
