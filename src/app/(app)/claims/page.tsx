import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClaimStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const claims = await prisma.claimMirror.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { documents: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Files</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Per-claim document timeline
        </h1>
        <p className="mt-2 max-w-xl text-sm text-brand-white/70">
          Distinct from the BLACKBOX activity log — this is only generated and
          executed documents, cross-linked by claim number.
        </p>
      </div>

      <div className="border border-brand-white/10">
        {claims.map((c) => (
          <Link
            key={c.id}
            href={`/claims/${c.id}`}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-white/5 px-4 py-4 last:border-0 hover:bg-brand-white/5"
          >
            <div>
              <p className="font-mono text-sm text-brand-letter-soft">{c.claimNumber}</p>
              <p className="text-sm text-brand-white">
                {c.claimantFirstName} {c.claimantLastName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-brand-slate">
                {c._count.documents} document{c._count.documents === 1 ? "" : "s"}
              </p>
              <ClaimStatusBadge status={c.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
