import { LetterFooter, Letterhead } from "@/components/brand/letterhead";
import { layoutLetterSections, matterBlockHtml } from "@/lib/stationery";
import { highlightMergeFields } from "@/lib/merge";
import { cn } from "@/lib/utils";

function escapeText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sectionHtml(text: string, highlightFields: boolean) {
  return highlightFields
    ? highlightMergeFields(text).replace(/\n/g, "<br/>")
    : escapeText(text).replace(/\n/g, "<br/>");
}

function inlineHtml(text: string, highlightFields: boolean) {
  return highlightFields ? highlightMergeFields(text) : escapeText(text);
}

export function DocPreview({
  body,
  highlightFields = false,
  className,
}: {
  body: string;
  highlightFields?: boolean;
  className?: string;
}) {
  const sections = layoutLetterSections(body);
  const html = sections
    .map((s) =>
      s.kind === "matter"
        ? matterBlockHtml(s.text, (value) => inlineHtml(value, highlightFields))
        : `<div class="doc-${s.kind}">${sectionHtml(s.text, highlightFields)}</div>`
    )
    .join("\n");

  return (
    <div className={cn("doc-sheet doc-preview min-h-[480px]", className)}>
      <Letterhead />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LetterFooter />
    </div>
  );
}
