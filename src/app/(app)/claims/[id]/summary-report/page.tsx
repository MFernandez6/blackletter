import { notFound, redirect } from "next/navigation";
import { canEdit, getSession, resolveSessionStaff } from "@/lib/auth";
import { findClaimMirror } from "@/lib/claim-mirror";
import { fetchSummaryReport } from "@/lib/integrations/blackbox-reports";
import { SummaryReportWorkspace } from "@/components/reports/summary-report-workspace";
import { ErrorBanner } from "@/components/ui/error-banner";

export const dynamic = "force-dynamic";

export default async function SummaryReportPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const staff = await resolveSessionStaff(session);

  const ref = decodeURIComponent(params.id);
  const mirror = await findClaimMirror({ ref, syncOnMiss: true });
  const lookup = mirror
    ? { claimId: mirror.blackboxClaimId }
    : /^BL-\d{2}-\d+$/i.test(ref)
      ? { claimNumber: ref.toUpperCase() }
      : { claimId: ref };

  let result = await fetchSummaryReport(lookup);
  if (!result.ok && result.status === 404 && mirror && mirror.blackboxClaimId !== ref) {
    result = await fetchSummaryReport({ claimId: ref });
  }
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="space-y-4">
        <p className="eyebrow">Summary Report</p>
        <ErrorBanner message={`Could not load the report from BLACKBOX: ${result.error}`} />
      </div>
    );
  }

  const blackboxUrl = process.env.NEXT_PUBLIC_BLACKBOX_URL?.replace(/\/$/, "");
  const claimId = result.payload.claim.id;

  return (
    <SummaryReportWorkspace
      payload={result.payload}
      editable={staff ? canEdit(staff.role) : false}
      backHref={mirror ? `/claims/${mirror.id}` : "/claims"}
      siblingHref={blackboxUrl ? `${blackboxUrl}/claims/${claimId}/summary-report` : undefined}
      siblingLabel="Open in BLACKBOX"
    />
  );
}
