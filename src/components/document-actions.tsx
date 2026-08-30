"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markExecutedAction,
  sendForSignatureAction,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";

export function DocumentActions({
  documentId,
  status,
  canWrite,
}: {
  documentId: string;
  status: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!canWrite) return null;

  async function send() {
    setError("");
    setPending(true);
    const result = await sendForSignatureAction({ generatedDocumentId: documentId });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(result.data.dryRun ? "Marked sent (SignWell dry-run)" : "Sent to SignWell");
    router.refresh();
  }

  async function execute() {
    setError("");
    setPending(true);
    const result = await markExecutedAction(documentId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(
      result.data.ledgerPayoutId
        ? `Executed · BLACKLEDGER payout ${result.data.ledgerPayoutId}`
        : "Marked executed"
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <Button type="button" variant="solid" size="sm" disabled={pending} onClick={send}>
            Send to SignWell
          </Button>
        ) : null}
        {status === "sent" || status === "signed" ? (
          <Button type="button" variant="solid" size="sm" disabled={pending} onClick={execute}>
            Mark executed
          </Button>
        ) : null}
      </div>
    </div>
  );
}
