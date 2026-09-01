const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DOCS_API = "https://docs.googleapis.com/v1/documents";
const INCH_PT = 72;
const DOC_MIME = "application/vnd.google-apps.document";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
].join(" ");

export type WorkspaceSendResult = {
  dryRun: boolean;
  provider: "google_workspace";
  providerDocumentId: string;
  embeddedUrl: string | null;
  status: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

let cachedToken:
  | { accessToken: string; expiresAt: number }
  | null = null;

function normalizePem(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

function serviceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: normalizePem(parsed.private_key),
        };
      }
    } catch {
      return null;
    }
  }
  const email = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (email && key) {
    return { client_email: email, private_key: normalizePem(key) };
  }
  return null;
}

export function googleWorkspaceConfigured(): boolean {
  if (serviceAccountFromEnv()) return true;
  return Boolean(
    process.env.GOOGLE_REFRESH_TOKEN?.trim() &&
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

function encodeJson(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function accessTokenFromServiceAccount(account: ServiceAccount) {
  const { createPrivateKey, createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const delegate = process.env.GOOGLE_WORKSPACE_DELEGATE?.trim();
  const claims: Record<string, string | number> = {
    iss: account.client_email,
    scope: SCOPES,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  if (delegate) claims.sub = delegate;

  const unsigned = `${encodeJson({ alg: "RS256", typ: "JWT" })}.${encodeJson(claims)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(createPrivateKey(account.private_key), "base64url")}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google auth failed (${res.status}): ${detail.slice(0, 240)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function accessTokenFromRefresh() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!.trim(),
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google refresh failed (${res.status}): ${detail.slice(0, 240)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }
  const account = serviceAccountFromEnv();
  cachedToken = account
    ? await accessTokenFromServiceAccount(account)
    : await accessTokenFromRefresh();
  return cachedToken.accessToken;
}

async function driveFetch(url: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Drive ${res.status}: ${detail.slice(0, 280)}`);
  }
  return res;
}

async function ensureClaimFolder(claimNumber: string): Promise<string | undefined> {
  const root = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!root) return undefined;

  const q = [
    `name = '${claimNumber.replace(/'/g, "\\'")}'`,
    `mimeType = '${FOLDER_MIME}'`,
    `'${root}' in parents`,
    "trashed = false",
  ].join(" and ");
  const lookup = await driveFetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`
  );
  const found = (await lookup.json()) as { files?: Array<{ id: string }> };
  if (found.files?.[0]?.id) return found.files[0].id;

  const created = await driveFetch(`${DRIVE_API}/files?supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: claimNumber,
      mimeType: FOLDER_MIME,
      parents: [root],
    }),
  });
  const folder = (await created.json()) as { id?: string };
  return folder.id ?? root;
}

async function uploadGoogleDoc(opts: {
  title: string;
  html: string;
  claimNumber: string;
}) {
  const parent = await ensureClaimFolder(opts.claimNumber);
  const boundary = `blackletter_${Date.now()}`;
  const metadata: Record<string, unknown> = {
    name: opts.title,
    mimeType: DOC_MIME,
  };
  if (parent) metadata.parents = [parent];

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    opts.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const res = await driveFetch(
    `${DRIVE_UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink,name`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  return (await res.json()) as { id: string; webViewLink?: string; name?: string };
}

async function setInchPageMargins(documentId: string) {
  const margin = { magnitude: INCH_PT, unit: "PT" };
  await driveFetch(`${DOCS_API}/${documentId}:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          updateDocumentStyle: {
            documentStyle: {
              marginTop: margin,
              marginBottom: margin,
              marginLeft: margin,
              marginRight: margin,
            },
            fields: "marginTop,marginBottom,marginLeft,marginRight",
          },
        },
      ],
    }),
  });
}

async function shareWithSigner(opts: {
  fileId: string;
  email: string;
  recipientName: string;
  title: string;
}) {
  const params = new URLSearchParams({
    supportsAllDrives: "true",
    sendNotificationEmail: "true",
    emailMessage: [
      `${opts.recipientName},`,
      "",
      `Blackline Public Adjusters has shared “${opts.title}” for your signature.`,
      "Open the Google Doc, use eSignature (Tools → eSignature), then notify your adjuster when it is signed.",
    ].join("\n"),
  });
  await driveFetch(`${DRIVE_API}/files/${opts.fileId}/permissions?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "user",
      role: "writer",
      emailAddress: opts.email,
    }),
  });
}

export async function sendViaGoogleWorkspace(opts: {
  title: string;
  html: string;
  claimNumber: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<WorkspaceSendResult> {
  if (!googleWorkspaceConfigured()) {
    return {
      dryRun: true,
      provider: "google_workspace",
      providerDocumentId: `gws-dry-${Date.now()}`,
      embeddedUrl: null,
      status: "sent",
    };
  }

  const file = await uploadGoogleDoc({
    title: opts.title,
    html: opts.html,
    claimNumber: opts.claimNumber,
  });
  try {
    await setInchPageMargins(file.id);
  } catch {
    /* Google Docs already defaults to 1in; do not block send. */
  }
  await shareWithSigner({
    fileId: file.id,
    email: opts.recipientEmail,
    recipientName: opts.recipientName,
    title: opts.title,
  });

  return {
    dryRun: false,
    provider: "google_workspace",
    providerDocumentId: file.id,
    embeddedUrl: file.webViewLink ?? `https://docs.google.com/document/d/${file.id}/edit`,
    status: "sent",
  };
}
