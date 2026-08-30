import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_API = "https://www.signwell.com/api/v1";

export type SignWellCreateResult = {
  dryRun: boolean;
  providerDocumentId: string;
  embeddedUrl?: string | null;
  status: string;
};

function apiBase() {
  return (process.env.SIGNWELL_API_URL || DEFAULT_API).replace(/\/$/, "");
}

export function signwellConfigured(): boolean {
  return Boolean(process.env.SIGNWELL_API_KEY);
}

export async function createSignWellDocument(opts: {
  name: string;
  fileUrl: string;
  fileName: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<SignWellCreateResult> {
  const key = process.env.SIGNWELL_API_KEY;
  const testMode = process.env.SIGNWELL_TEST_MODE !== "0";

  if (!key) {
    return {
      dryRun: true,
      providerDocumentId: `dry-${Date.now()}`,
      embeddedUrl: null,
      status: "sent",
    };
  }

  const res = await fetch(`${apiBase()}/documents`, {
    method: "POST",
    headers: {
      "X-Api-Key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: opts.name,
      test_mode: testMode,
      files: [{ name: opts.fileName, file_url: opts.fileUrl }],
      recipients: [
        {
          id: "1",
          name: opts.recipientName,
          email: opts.recipientEmail,
        },
      ],
      fields: [
        [
          {
            page: 1,
            x: 72,
            y: 640,
            type: "signature",
            recipient_id: "1",
          },
        ],
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`SignWell ${res.status}: ${detail.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    id?: string;
    embedded_edit_url?: string;
    recipients?: Array<{ embedded_signing_url?: string }>;
  };

  return {
    dryRun: false,
    providerDocumentId: data.id ?? `sw-${Date.now()}`,
    embeddedUrl:
      data.recipients?.[0]?.embedded_signing_url ??
      data.embedded_edit_url ??
      null,
    status: "sent",
  };
}

export type SignWellWebhookPayload = {
  event?: {
    type?: string;
    time?: string | number;
    hash?: string;
  };
  data?: {
    object?: {
      id?: string;
    };
  };
};

export function verifySignWellWebhook(
  payload: SignWellWebhookPayload
): { ok: boolean; error?: string } {
  const webhookId = process.env.SIGNWELL_WEBHOOK_ID;
  if (!webhookId) {
    // Local / unset: accept events so the handler can be exercised.
    return { ok: true };
  }
  const type = payload.event?.type;
  const time = payload.event?.time;
  const hash = payload.event?.hash;
  if (!type || time === undefined || !hash) {
    return { ok: false, error: "Webhook event missing type, time, or hash." };
  }
  const calculated = createHmac("sha256", webhookId)
    .update(`${type}@${time}`)
    .digest("hex");
  const a = Buffer.from(calculated);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid webhook signature." };
  }
  return { ok: true };
}

export function documentIdFromPayload(payload: SignWellWebhookPayload): string | null {
  return payload.data?.object?.id ?? null;
}
