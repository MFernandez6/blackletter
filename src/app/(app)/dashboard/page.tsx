import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextDocumentForClaim } from "@/lib/next-document";
import { STAGE_LABELS } from "@/lib/constants";
import { canEdit } from "@/lib/auth-client";
import { SyncButton } from "@/components/sync-button";
import { Button } from "@/components/ui/button";
import { ClaimStatusBadge, DocStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const writable = session ? canEdit(session.user.role) : false;

  const [claims, drafts, awaiting, executed, templates] = await Promise.all([
    prisma.claimMirror.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.generatedDocument.count({ where: { status: "draft" } }),
    prisma.generatedDocument.count({ where: { status: "sent" } }),
    prisma.generatedDocument.count({ where: { status: "executed" } }),
    prisma.documentTemplate.count({ where: { isActive: true } }),
  ]);

  const suggestions = await Promise.all(
    claims.map((c) =>
      nextDocumentForClaim({
        claimId: c.blackboxClaimId,
        claimNumber: c.claimNumber,
        status: c.status,
        aobApplicable: c.aobApplicable,
      })
    )
  );

  const due = claims
    .map((c, i) => ({ claim: c, next: suggestions[i]?.next ?? null }))
    .filter((row) => row.next);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Document desk</p>
          <h1 className="mt-2 font-serif text-2xl tracking-[0.1em] text-brand-white">
            What each file needs next
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-white/70">
            Stage-mapping lives here so BLACKBOX can ask the same question from
            a claim. Merge fields pull from BLACKBOX; intake originals stay in BLACKGATE.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {writable ? <SyncButton /> : null}
          <Button asChild size="sm" variant="solid">
            <Link href="/generate">Generate from claim</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Templates in library", value: templates },
          { label: "Drafts", value: drafts },
          { label: "Awaiting signature", value: awaiting },
          { label: "Executed", value: executed },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-brand-white/10 px-4 py-4">
            <p className="eyebrow">{kpi.label}</p>
            <p className="mt-2 font-serif text-3xl text-brand-letter-soft">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section>
        <p className="eyebrow mb-3">Due next</p>
        <div className="border border-brand-white/10">
          {due.length === 0 ? (
            <p className="px-4 py-8 text-sm text-brand-slate">
              No required documents outstanding on mirrored files.
            </p>
          ) : (
            due.map(({ claim, next }) => (
              <Link
                key={claim.id}
                href={`/generate/${claim.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-white/5 px-4 py-3 last:border-0 hover:bg-brand-white/5"
              >
                <div>
                  <p className="font-mono text-sm text-brand-letter-soft">{claim.claimNumber}</p>
                  <p className="text-sm text-brand-white">
                    {claim.claimantFirstName} {claim.claimantLastName}
                  </p>
                  <p className="text-xs text-brand-slate">
                    {claim.propertyAddress} · {claim.county}
                  </p>
                </div>
                <div className="text-right">
                  <ClaimStatusBadge status={claim.status} />
                  <p className="mt-2 text-sm text-brand-white">{next?.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-slate">
                    {next ? STAGE_LABELS[next.stage] : ""}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <p className="eyebrow">Recent documents</p>
          <Link
            href="/tracker"
            className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-letter-soft"
          >
            Status tracker
          </Link>
        </div>
        <RecentDocs />
      </section>
    </div>
  );
}

async function RecentDocs() {
  const docs = await prisma.generatedDocument.findMany({
    orderBy: { generatedAt: "desc" },
    take: 8,
    include: { templateVersion: { select: { version: true } } },
  });
  if (docs.length === 0) {
    return <p className="text-sm text-brand-slate">Nothing generated yet.</p>;
  }
  return (
    <div className="border border-brand-white/10">
      {docs.map((d) => (
        <Link
          key={d.id}
          href={`/documents/${d.id}`}
          className="flex items-center justify-between gap-3 border-b border-brand-white/5 px-4 py-3 last:border-0 hover:bg-brand-white/5"
        >
          <div>
            <p className="text-sm text-brand-white">{d.title}</p>
            <p className="font-mono text-xs text-brand-slate">
              {d.claimNumber} · template v{d.templateVersion.version}
            </p>
          </div>
          <DocStatusBadge status={d.status} />
        </Link>
      ))}
    </div>
  );
}
