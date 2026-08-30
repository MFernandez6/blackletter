/**
 * On executed settlement / release, open a BLACKLEDGER payout rather
 * than requiring finance to re-key the settlement amount.
 */
export async function triggerLedgerPayout(opts: {
  claimNumber: string;
  blackboxClaimId: string;
  settlementAmount: number | null;
  settlementDate?: string | null;
  generatedDocumentId: string;
  notes?: string;
}): Promise<{ ok: boolean; dryRun: boolean; payoutId?: string; error?: string }> {
  const base = process.env.BLACKLEDGER_API_URL?.replace(/\/$/, "");
  const key = process.env.BLACKLEDGER_API_KEY;
  if (!base || !key) {
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch(`${base}/api/payouts/from-settlement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        claimNumber: opts.claimNumber,
        blackboxClaimId: opts.blackboxClaimId,
        settlementAmount: opts.settlementAmount,
        settlementDate: opts.settlementDate,
        generatedDocumentId: opts.generatedDocumentId,
        source: "BLACKLETTER",
        notes: opts.notes,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        dryRun: false,
        error: `BLACKLEDGER ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as { id?: string; payoutId?: string };
    return {
      ok: true,
      dryRun: false,
      payoutId: data.payoutId ?? data.id,
    };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "BLACKLEDGER request failed.",
    };
  }
}
