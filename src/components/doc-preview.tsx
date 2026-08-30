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
  const html = highlightFields
    ? highlightMergeFields(body).replace(/\n/g, "<br/>")
    : body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

  return (
    <div
      className={cn("doc-preview min-h-[480px]", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
