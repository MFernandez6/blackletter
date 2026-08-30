"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveTemplateVersionAction } from "@/lib/actions/templates";
import { MERGE_FIELD_HELP } from "@/lib/constants";
import { extractMergeFields } from "@/lib/merge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DocPreview } from "@/components/doc-preview";

export function TemplateEditor({
  templateId,
  documentType,
  initialBody,
  currentVersion,
  canPublish,
}: {
  templateId: string;
  documentType: string;
  initialBody: string;
  currentVersion: number;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [changeNote, setChangeNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const fields = extractMergeFields(body);

  function insertField(key: string) {
    setBody((prev) => `${prev}{{${key}}}`);
  }

  async function publish() {
    setError("");
    setPending(true);
    const result = await saveTemplateVersionAction({
      templateId,
      body,
      changeNote: changeNote || `Revised ${documentType} language`,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(`Published version ${result.data.version}`);
    setChangeNote("");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}
        <div className="flex flex-wrap gap-2">
          {Object.keys(MERGE_FIELD_HELP).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => insertField(key)}
              className="border border-brand-letter/30 bg-brand-letter/10 px-2 py-1 font-mono text-[10px] text-brand-letter-soft hover:bg-brand-letter/20"
              title={MERGE_FIELD_HELP[key]}
            >
              {`{{${key}}}`}
            </button>
          ))}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[420px] font-mono text-[13px] leading-relaxed"
          disabled={!canPublish}
        />
        <p className="text-xs text-brand-slate">
          Detected fields: {fields.length ? fields.map((f) => `{{${f}}}`).join("  ") : "none"}
        </p>
        {canPublish ? (
          <div className="space-y-3 border border-brand-white/10 p-4">
            <p className="eyebrow">New version (compliance trail)</p>
            <p className="text-sm text-brand-white/70">
              Saving never overwrites v{currentVersion}. The signed copy on every
              claim keeps pointing at the version that was generated.
            </p>
            <div className="space-y-2">
              <Label htmlFor="changeNote">Change note</Label>
              <Input
                id="changeNote"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Fla. Stat. § 626.854 fee-cap update"
              />
            </div>
            <Button type="button" variant="solid" onClick={publish} disabled={pending}>
              {pending ? "Publishing…" : `Publish v${currentVersion + 1}`}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-brand-slate">Only ADMIN may publish contract language.</p>
        )}
      </div>
      <div>
        <p className="eyebrow mb-3">Preview with placeholders marked</p>
        <DocPreview body={body} highlightFields />
      </div>
    </div>
  );
}
