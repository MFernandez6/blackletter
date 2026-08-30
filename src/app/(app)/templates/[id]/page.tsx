import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, canManageTemplates } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MERGE_FIELD_HELP, STAGE_LABELS } from "@/lib/constants";
import type { LifecycleStage } from "@/lib/types";
import { parseJson } from "@/lib/utils";
import { TemplateEditor } from "@/components/template-editor";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const template = await prisma.documentTemplate.findUnique({
    where: { id: params.id },
    include: {
      currentVersion: true,
      stageMap: true,
    },
  });
  if (!template || !template.currentVersion) notFound();

  const fields = parseJson<string[]>(template.mergeFieldsJson, []);
  const canPublish = session ? canManageTemplates(session.user.role) : false;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            {STAGE_LABELS[template.stage as LifecycleStage]} · {template.documentType}
          </p>
          <h1 className="mt-2 font-serif text-2xl tracking-[0.08em] text-brand-white">
            {template.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-white/70">{template.description}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/templates/${template.id}/versions`}>Version history</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {fields.map((key) => (
          <span
            key={key}
            className="border border-brand-letter/30 bg-brand-letter/10 px-2 py-1 font-mono text-[11px] text-brand-letter-soft"
            title={MERGE_FIELD_HELP[key]}
          >
            {`{{${key}}}`}
          </span>
        ))}
      </div>

      <TemplateEditor
        templateId={template.id}
        documentType={template.documentType}
        initialBody={template.currentVersion.body}
        currentVersion={template.currentVersion.version}
        canPublish={canPublish}
      />
    </div>
  );
}
