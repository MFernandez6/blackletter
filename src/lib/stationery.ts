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
    <td width="64" valign="middle" style="width:64px;padding:0 16px 0 0;">
      <img src="${MARK_PNG}" width="52" height="52" alt="Blackline Public Adjusters" />
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
