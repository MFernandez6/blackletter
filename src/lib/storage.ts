import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { wrapStationeryHtml } from "@/lib/stationery";

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
  return Buffer.from(wrapStationeryHtml(title, body), "utf8");
}
