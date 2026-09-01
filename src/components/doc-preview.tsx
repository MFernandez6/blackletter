import { LetterFooter, Letterhead } from "@/components/brand/letterhead";
import { stripLegacyFirmHeader } from "@/lib/stationery";
import { highlightMergeFields } from "@/lib/merge";
import { cn } from "@/lib/utils";

export function DocPreview({
  body,
  highlightFields = false,
  className,
}: {
  body: string;
  highlightFields?: boolean;
  className?: string;
}) {
  const prepared = stripLegacyFirmHeader(body);
  const html = highlightFields
    ? highlightMergeFields(prepared).replace(/\n/g, "<br/>")
    : prepared
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

  return (
    <div className={cn("doc-sheet doc-preview min-h-[480px]", className)}>
      <Letterhead />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LetterFooter />
    </div>
  );
}
