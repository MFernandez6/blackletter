import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { nextDocumentForClaim } from "@/lib/next-document";
import { ClaimStatusBadge } from "@/components/status-badge";
import { SyncButton } from "@/components/sync-button";

export const dynamic = "force-dynamic";

export default async function GenerateIndexPage() {
  const claims = await prisma.claimMirror.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const suggestions = await Promise.all(
    claims.map((c) =>
      nextDocumentForClaim({
        claimId: c.blackboxClaimId,
        status: c.status,
        aobApplicable: c.aobApplicable,
      })
    )
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Generate from claim</p>
          <h1 className="mt-2 font-serif text-3xl text-brand-gold">
            Select a file
          </h1>
          <p className="mt-2 max-w-xl text-sm text-brand-white/70">
            The next likely document is suggested from claim stage, BLACKLETTER
            history, and anything already signed at BLACKGATE intake.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="border border-brand-white/10">
        {claims.map((c, i) => {
          const next = suggestions[i]?.next;
          return (
            <Link
              key={c.id}
              href={`/generate/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-white/5 px-4 py-4 last:border-0 hover:bg-brand-white/5"
            >
              <div>
                <p className="font-mono text-sm text-brand-letter-soft">{c.claimNumber}</p>
                <p className="text-sm text-brand-white">
                  {c.claimantFirstName} {c.claimantLastName}
                </p>
                <p className="text-xs text-brand-slate">
                  {c.carrierName ?? "Carrier pending"} · {c.propertyAddress}
                </p>
              </div>
              <div className="text-right">
                <ClaimStatusBadge status={c.status} />
                <p className="mt-2 text-sm text-brand-white">
                  {next ? next.name : "Stage complete"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
