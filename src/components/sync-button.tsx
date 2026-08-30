"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { syncFromBlackboxAction } from "@/lib/actions/sync";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const result = await syncFromBlackboxAction();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.dryRun
        ? "Using local claim mirrors (BLACKBOX dry-run)"
        : `Synced ${result.upserted} files from BLACKBOX`
    );
    router.refresh();
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={run} disabled={pending}>
      {pending ? "Syncing…" : "Sync BLACKBOX"}
    </Button>
  );
}
