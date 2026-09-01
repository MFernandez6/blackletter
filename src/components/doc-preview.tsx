import { LetterFooter, Letterhead } from "@/components/brand/letterhead";
import { layoutLetterSections } from "@/lib/stationery";
import { highlightMergeFields } from "@/lib/merge";
import { cn } from "@/lib/utils";

function sectionHtml(text: string, highlightFields: boolean) {
  return highlightFields
    ? highlightMergeFields(text).replace(/\n/g, "<br/>")
    : text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
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
    .map(
      (s) =>
        `<div class="doc-${s.kind}">${sectionHtml(s.text, highlightFields)}</div>`
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
