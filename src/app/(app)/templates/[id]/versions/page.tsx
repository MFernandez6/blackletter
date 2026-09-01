import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DocPreview } from "@/components/doc-preview";

export const dynamic = "force-dynamic";

export default async function TemplateVersionsPage({
  params,
}: {
  params: { id: string };
}) {
  const template = await prisma.documentTemplate.findUnique({
    where: { id: params.id },
    include: {
      versions: {
        orderBy: { version: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!template) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/templates/${template.id}`}
          className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-letter-soft"
        >
          Back to editor
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-brand-gold">
          Version history — {template.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-white/70">
          Append-only audit trail. Generated documents keep the version that was
          merged on that claim, even after later regulatory edits.
        </p>
      </div>

      <div className="space-y-8">
        {template.versions.map((v) => (
          <article key={v.id} className="border border-brand-white/10">
            <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-brand-white/10 px-4 py-3">
              <div>
                <p className="font-mono text-sm text-brand-letter-soft">v{v.version}</p>
                <p className="text-sm text-brand-white/80">
                  {v.changeNote || "No change note"}
                </p>
              </div>
              <p className="text-xs text-brand-slate">
                {v.createdBy.name} · {format(v.createdAt, "MMM d, yyyy h:mm a")}
              </p>
            </header>
            <DocPreview body={v.body} highlightFields className="min-h-0" />
          </article>
        ))}
      </div>
    </div>
  );
}
