import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const LETTER_DOCS_BUCKET = "letter-documents";

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export type StoredDocument = {
  fileUrl: string;
  storagePath: string;
};

function publicObjectUrl(cfg: { url: string }, objectPath: string) {
  return `${cfg.url}/storage/v1/object/public/${LETTER_DOCS_BUCKET}/${objectPath}`;
}

/**
 * Optional local / Supabase copy. Drafts live in the database (`mergedBody`).
 * Production send creates a Google Doc — this helper must never fail a generate.
 */
export async function storeLetterDocument(opts: {
  claimNumber: string;
  fileName: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<StoredDocument | null> {
  const safeClaim = opts.claimNumber.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = opts.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${safeClaim}/${Date.now()}-${safeName}`;
  const cfg = supabaseConfig();

  if (cfg) {
    const endpoint = `${cfg.url}/storage/v1/object/${LETTER_DOCS_BUCKET}/${objectPath}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        apikey: cfg.key,
        "Content-Type": opts.mimeType || "text/html; charset=utf-8",
        "x-upsert": "false",
      },
      body: new Uint8Array(opts.bytes),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Storage upload failed (${res.status}): ${detail || res.statusText}`
      );
    }

    return {
      fileUrl: publicObjectUrl(cfg, objectPath),
      storagePath: objectPath,
    };
  }

  if (process.env.VERCEL) {
    return null;
  }

  const relDir = path.join("uploads", safeClaim);
  const absDir = path.join(process.cwd(), "public", relDir);
  await mkdir(absDir, { recursive: true });
  const storedName = path.basename(objectPath);
  await writeFile(path.join(absDir, storedName), opts.bytes);
  const fileUrl = `/${relDir}/${storedName}`.replace(/\\/g, "/");
  return { fileUrl, storagePath: objectPath };
}

export function documentHtmlFile(title: string, body: string): Buffer {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1f26; max-width: 740px; margin: 48px auto; line-height: 1.55; }
    h1, h2 { font-family: "Times New Roman", serif; letter-spacing: 0.04em; }
    .meta { font-size: 12px; color: #5b6570; text-transform: uppercase; letter-spacing: 0.14em; }
    p { margin: 0 0 1em; }
    .sign { margin-top: 48px; padding-top: 24px; border-top: 1px solid #c5ccd3; font-size: 13px; }
    .sign .line { margin-top: 28px; letter-spacing: 0.08em; }
  </style>
</head>
<body>
${body
  .split(/\n{2,}/)
  .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br/>")}</p>`)
  .join("\n")}
<div class="sign">
  <p class="meta">Signature</p>
  <p>Sign in Google Docs with Workspace eSignature (Tools → eSignature), then notify Blackline when complete.</p>
  <p class="line">Client signature _______________________________ Date ______________</p>
</div>
</body>
</html>`;
  return Buffer.from(html, "utf8");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
