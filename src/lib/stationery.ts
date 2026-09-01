import { FIRM } from "@/lib/constants";

/** Raster of the datum mark — Google Docs keeps PNG; SVG is often stripped. */
const MARK_PNG =
  "data:image/png;base64,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";

export function stripLegacyFirmHeader(body: string): string {
  return body.replace(/^\uFEFF/, "").replace(
    /^(?:\{\{firm_name\}\}|BLACKLINE PUBLIC ADJUSTERS LLC)\r?\n(?:\{\{firm_address\}\}|[^\n\r]+)\r?\n(?:\{\{firm_phone\}\}[^\n\r]*|[^\n\r]*·[^\n\r]*)\r?\n+/i,
    ""
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function letterheadHtml(): string {
  return `<table class="lh" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="94" valign="middle" style="width:94px;padding:0 16px 0 0;">
      <img src="${MARK_PNG}" width="78" height="48" alt="Blackline Public Adjusters" />
    </td>
    <td valign="middle" style="padding:0;">
      <div class="word">BLACKLINE</div>
      <div class="sub">Public Adjusters LLC</div>
    </td>
  </tr>
</table>
<div class="rule"></div>
<p class="contact">${escapeHtml(FIRM.address)} · ${escapeHtml(FIRM.phone)} · ${escapeHtml(FIRM.email)} · ${escapeHtml(FIRM.website)}</p>`;
}

function letterFooterHtml(): string {
  return `<div class="ft">
  <p class="ft-main">${escapeHtml(FIRM.legalName)} · Licensed public adjusters · ${escapeHtml(FIRM.statuteCite)}</p>
  <p class="ft-sub">Confidential · prepared solely for the named insured and their carrier</p>
</div>`;
}

function bodyHtml(body: string): string {
  return stripLegacyFirmHeader(body)
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

export function wrapStationeryHtml(
  title: string,
  body: string,
  opts?: { signature?: boolean }
): string {
  const sign = opts?.signature !== false;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 0.85in 0.95in 1in; }
    html, body { background: #f4efe4; }
    body {
      font-family: Georgia, "Times New Roman", Times, serif;
      color: #0f1c2e;
      max-width: 720px;
      margin: 0 auto;
      padding: 36px 8px 48px;
      line-height: 1.7;
      font-size: 15px;
    }
    .lh { border-collapse: collapse; margin: 0 0 6px; }
    .word {
      font-family: "Times New Roman", Times, serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.22em;
      color: #0f1c2e;
      line-height: 1;
    }
    .sub {
      font-family: "Times New Roman", Times, serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #4a5560;
      padding-top: 8px;
    }
    .rule {
      height: 1px;
      background: #c6a85b;
      margin: 18px 0 10px;
      font-size: 0;
    }
    .contact {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8a7a4a;
      margin: 0 0 36px;
    }
    p { margin: 0 0 1.05em; }
    .sign {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid #c6a85b;
      font-size: 13px;
    }
    .sign .meta {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8a7a4a;
      margin: 0 0 8px;
    }
    .sign .line { margin-top: 28px; letter-spacing: 0.06em; }
    .ft {
      margin-top: 48px;
      padding-top: 12px;
      border-top: 1px solid #c6a85b;
    }
    .ft-main, .ft-sub {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin: 0;
    }
    .ft-main { font-weight: 700; color: #8a7a4a; }
    .ft-sub { color: #9a8b68; margin-top: 6px; letter-spacing: 0.14em; }
  </style>
</head>
<body>
${letterheadHtml()}
${bodyHtml(body)}
${
  sign
    ? `<div class="sign">
  <p class="meta">Acknowledgement</p>
  <p>Sign in Google Docs with Workspace eSignature (Tools → eSignature), then notify Blackline when complete.</p>
  <p class="line">Client signature _______________________________ Date ______________</p>
</div>`
    : ""
}
${letterFooterHtml()}
</body>
</html>`;
}
