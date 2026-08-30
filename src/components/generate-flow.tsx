"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  generateDocumentAction,
  sendForSignatureAction,
} from "@/lib/actions/documents";
import { DOCUMENT_TYPE_LABELS, STAGE_LABELS } from "@/lib/constants";
import type { DocumentType, NextDocumentResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DocPreview } from "@/components/doc-preview";
import { DocStatusBadge } from "@/components/status-badge";

type Preview = {
  documentType: DocumentType;
  title: string;
  body: string;
  missing: string[];
};

export function GenerateFlow({
  claimId,
  claimNumber,
  suggestion,
  previews,
  canWrite,
}: {
  claimId: string;
  claimNumber: string;
  suggestion: NextDocumentResult;
  previews: Preview[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const defaultType =
    suggestion.next?.documentType ?? previews[0]?.documentType ?? "LOR";
  const [selected, setSelected] = useState<DocumentType>(defaultType);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const preview = previews.find((p) => p.documentType === selected) ?? previews[0];
  const dueRow = suggestion.due.find((d) => d.documentType === selected);

  async function generate(sendAfter: boolean) {
    setError("");
    setPending(true);
    const created = await generateDocumentAction({
      claimMirrorId: claimId,
      documentType: selected,
    });
    if (!created.ok) {
      setPending(false);
      setError(created.error);
      return;
    }
    if (sendAfter) {
      const sent = await sendForSignatureAction({
        generatedDocumentId: created.data.id,
      });
      setPending(false);
      if (!sent.ok) {
        setError(sent.error);
        return;
      }
      toast.success(
        sent.data.dryRun
          ? "Draft stored · SignWell dry-run (no API key)"
          : "Sent to SignWell"
      );
    } else {
      setPending(false);
      toast.success("Draft generated");
    }
    router.push(`/claims/${claimId}`);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <p className="eyebrow">Suggested next</p>
        {suggestion.next ? (
          <button
            type="button"
            onClick={() => setSelected(suggestion.next!.documentType)}
            className="w-full border border-brand-letter/40 bg-brand-letter/10 p-3 text-left"
          >
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-brand-letter-soft">
              Due now
            </p>
            <p className="mt-1 text-sm text-brand-white">{suggestion.next.name}</p>
            <p className="mt-1 text-xs text-brand-slate">{suggestion.next.reason}</p>
          </button>
        ) : (
          <p className="text-sm text-brand-slate">Required documents for this stage are on file.</p>
        )}

        <p className="eyebrow pt-4">All types</p>
        <div className="space-y-1">
          {previews.map((p) => {
            const due = suggestion.due.find((d) => d.documentType === p.documentType);
            return (
              <button
                key={p.documentType}
                type="button"
                onClick={() => setSelected(p.documentType)}
                className={`flex w-full items-start justify-between gap-2 border px-3 py-2 text-left text-sm ${
                  selected === p.documentType
                    ? "border-brand-letter/50 bg-brand-letter/10"
                    : "border-brand-white/10 hover:bg-brand-white/5"
                }`}
              >
                <span>
                  <span className="block text-brand-white">
                    {DOCUMENT_TYPE_LABELS[p.documentType]}
                  </span>
                  <span className="block font-sans text-[9px] uppercase tracking-[0.16em] text-brand-slate">
                    {due ? STAGE_LABELS[due.stage] : ""}
                    {due?.alreadyOnFile ? " · on file" : ""}
                  </span>
                </span>
                {due?.alreadyOnFile && due.onFileStatus ? (
                  <DocStatusBadge status={due.onFileStatus} />
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="space-y-4">
        {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{claimNumber}</p>
            <h2 className="mt-1 font-serif text-xl text-brand-white">
              {preview?.title}
            </h2>
            {dueRow?.alreadyOnFile ? (
              <p className="mt-2 text-sm text-brand-letter-soft">
                Already on file via {dueRow.onFileSource} ({dueRow.onFileStatus}).
                Regenerating creates a new BLACKLETTER copy; it does not replace the intake original.
              </p>
            ) : null}
            {preview?.missing.length ? (
              <p className="mt-2 text-xs text-brand-slate">
                Incomplete merge fields: {preview.missing.map((f) => `{{${f}}}`).join(", ")}
              </p>
            ) : null}
          </div>
          {canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => generate(false)}
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="solid"
                disabled={pending}
                onClick={() => generate(true)}
              >
                {pending ? "Working…" : "Preview · send to SignWell"}
              </Button>
            </div>
          ) : null}
        </div>
        {preview ? <DocPreview body={preview.body} /> : null}
      </section>
    </div>
  );
}
