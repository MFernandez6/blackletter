import { Badge } from "@/components/ui/badge";
import { CLAIM_STATUS_LABELS, DOC_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DOC_TONE: Record<string, string> = {
  draft: "border-brand-white/15 text-brand-slate",
  sent: "border-brand-letter/40 text-brand-letter-soft",
  signed: "border-brand-letter/60 text-brand-letter-soft",
  executed: "border-brand-letter bg-brand-letter/15 text-brand-letter-soft",
};

export function DocStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(DOC_TONE[status] ?? "border-brand-white/15 text-brand-slate")}>
      {DOC_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ClaimStatusBadge({ status }: { status: string }) {
  return (
    <Badge className="border-brand-white/15 text-brand-white/80">
      {CLAIM_STATUS_LABELS[status as keyof typeof CLAIM_STATUS_LABELS] ?? status}
    </Badge>
  );
}
