import { FIRM } from "@/lib/constants";

/** Raster of the datum mark — Google Docs keeps PNG; SVG is often stripped. */
const MARK_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAADE0lEQVR4nO3dwW3CQBBAUYioikqQqA/JldAWOUW5IBKMN87H711BK1++RjuX3e0AAAAAAAAAAAAAAAAAAAAAgG/7pQ66TufbUmfBuzueLou097HEIcA6BAxhAoYwAUPYYeThS13UoWzkgtcEhjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhA19XnRL7j0h6XlVRjOBIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCHssPYH1F2n8+2n346ny/7vvogtMYFf8CjeOf+DZwl4pmejFDEjCBjC8nfg0mQrfeuWlHcUJjCECRjCBAxhAoaw/BJrrQXEnIVUeVnC/2QCQ5iAZ3p2mpq+jCDgF/w2SvEySv4OvLavOO/diYXLaCYwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmNcJF+IlQtZgAkOYgCFMwBAmYAgTMIQJGMIEDGEChjABQ5iAIUzAECZgCBMwhAkYwgQMYQKGMAFDmIAhTMAQJmAIEzCECRjCBAxhAoYwAUOYgCFMwBAmYAgTMIQNfZ3wOp1vI8+HrTOBIUzAECZgCBMwAAAAAAAAAAAAAAAAAAAAAABv4hMSMDmoMXDKuwAAAABJRU5ErkJggg==";

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
