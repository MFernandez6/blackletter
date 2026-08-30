import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_TYPE_BLURB,
  STAGE_BLURB,
  STAGE_LABELS,
  STAGE_ORDER,
} from "@/lib/constants";
import type { LifecycleStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.documentTemplate.findMany({
    where: { isActive: true },
    include: {
      currentVersion: { select: { version: true, createdAt: true } },
      stageMap: true,
      _count: { select: { versions: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Template library</p>
        <h1 className="mt-2 font-serif text-2xl tracking-[0.1em] text-brand-white">
          Full claim lifecycle
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-white/70">
          Merge fields are marked as <span className="font-mono text-brand-letter-soft">{"{{claimant_name}}"}</span>.
          Publishing a change creates a new version — the copy signed on a claim never moves.
        </p>
      </div>

      {STAGE_ORDER.map((stage) => {
        const rows = templates.filter((t) => t.stage === stage);
        if (rows.length === 0) return null;
        return (
          <section key={stage}>
            <p className="eyebrow">{STAGE_LABELS[stage as LifecycleStage]}</p>
            <p className="mt-1 mb-4 text-sm text-brand-slate">
              {STAGE_BLURB[stage as LifecycleStage]}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((t) => (
                <Link
                  key={t.id}
                  href={`/templates/${t.id}`}
                  className="border border-brand-white/10 p-4 hover:border-brand-letter/40 hover:bg-brand-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-lg text-brand-white">{t.name}</h2>
                    <span className="font-mono text-xs text-brand-letter-soft">
                      v{t.currentVersion?.version ?? 0}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-brand-white/70">
                    {DOCUMENT_TYPE_BLURB[t.documentType as keyof typeof DOCUMENT_TYPE_BLURB]}
                  </p>
                  <p className="mt-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-brand-slate">
                    {t._count.versions} version{t._count.versions === 1 ? "" : "s"}
                    {t.stageMap?.required ? " · required" : " · optional"}
                    {t.stageMap?.aobOnly ? " · AOB only" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
