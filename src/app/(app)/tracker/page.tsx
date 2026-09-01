import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DOCUMENT_STATUSES } from "@/lib/types";
import { DOC_STATUS_LABELS } from "@/lib/constants";
import { DocStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const docs = await prisma.generatedDocument.findMany({
    orderBy: { generatedAt: "desc" },
    include: { templateVersion: { select: { version: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Status tracker</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Draft · awaiting signature · executed
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {DOCUMENT_STATUSES.filter((s) => s !== "signed").map((status) => {
          const rows =
            status === "sent"
              ? docs.filter((d) => d.status === "sent" || d.status === "signed")
              : docs.filter((d) => d.status === status);
          const label =
            status === "sent" ? "Awaiting signature" : DOC_STATUS_LABELS[status];
          return (
            <section key={status} className="border border-brand-white/10">
              <header className="border-b border-brand-white/10 px-4 py-3">
                <p className="eyebrow">{label}</p>
                <p className="mt-1 font-serif text-2xl text-brand-letter-soft">
                  {rows.length}
                </p>
              </header>
              <ul>
                {rows.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-brand-slate">None</li>
                ) : (
                  rows.map((d) => (
                    <li key={d.id} className="border-b border-brand-white/5 last:border-0">
                      <Link
                        href={`/documents/${d.id}`}
                        className="block px-4 py-3 hover:bg-brand-white/5"
                      >
                        <p className="text-sm text-brand-white">{d.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="font-mono text-xs text-brand-slate">
                            {d.claimNumber} · v{d.templateVersion.version}
                          </p>
                          <DocStatusBadge status={d.status} />
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
