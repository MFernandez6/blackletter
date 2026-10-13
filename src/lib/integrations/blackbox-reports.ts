import type { SummaryReportPayload } from "@/lib/reports/summary-report";

type Lookup = { claimId: string } | { claimNumber: string };

type Result =
  | { ok: true; payload: SummaryReportPayload }
  | { ok: false; status: number; error: string };

function config() {
  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  const key =
    process.env.BLACKLETTER_API_KEY?.trim() || process.env.BLACKBOX_API_KEY?.trim();
  return base && key ? { base, key } : null;
}

async function call(path: string, init: RequestInit = {}): Promise<Result> {
  const cfg = config();
  if (!cfg) {
    return {
      ok: false,
      status: 503,
      error: "BLACKBOX_API_URL and BLACKLETTER_API_KEY must be set to load summary reports.",
    };
  }
  try {
    const res = await fetch(`${cfg.base}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${cfg.key}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const data = (await res.json().catch(() => null)) as
      | (SummaryReportPayload & { error?: string })
      | null;
    if (!res.ok || !data) {
      return { ok: false, status: res.status, error: data?.error ?? `BLACKBOX ${res.status}` };
    }
    return { ok: true, payload: data };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : "BLACKBOX is unreachable.",
    };
  }
}

export function fetchSummaryReport(lookup: Lookup): Promise<Result> {
  const qs = new URLSearchParams(lookup as Record<string, string>);
  return call(`/api/reports/summary?${qs.toString()}`);
}

export function putSummaryReport(body: {
  claimId: string;
  header: Record<string, string>;
  sections: Record<string, string>;
  status: "DRAFT" | "FINAL";
  actorEmail?: string;
}): Promise<Result> {
  return call("/api/reports/summary", { method: "PUT", body: JSON.stringify(body) });
}
