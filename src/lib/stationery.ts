import { FIRM } from "@/lib/constants";
import { LETTERHEAD_LOGO, LETTER_SEAL } from "@/lib/brand-images";

/** Standard letter page margin — preview, print, and Google Docs. */
export const LETTER_PAGE_MARGIN = "1in";

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
  return `<div class="lh"><img src="${LETTERHEAD_LOGO.src}" width="${LETTERHEAD_LOGO.width}" height="${LETTERHEAD_LOGO.height}" alt="Blackline Public Adjusters LLC" /></div>
<div class="rule"></div>
<p class="contact">${escapeHtml(FIRM.address)} · ${escapeHtml(FIRM.phone)} · ${escapeHtml(FIRM.email)} · ${escapeHtml(FIRM.website)}</p>`;
}

function sealHtml(): string {
  return `<div class="seal"><img src="${LETTER_SEAL.src}" width="${LETTER_SEAL.width}" height="${LETTER_SEAL.height}" alt="Blackline Public Adjusters LLC seal" /></div>`;
}

function letterFooterHtml(): string {
  return `<div class="ft">
  <p class="ft-main">${escapeHtml(FIRM.legalName)} · Licensed public adjusters · ${escapeHtml(FIRM.statuteCite)}</p>
  <p class="ft-sub">Confidential · prepared solely for the named insured and their carrier</p>
</div>`;
}

export type LetterSection = {
  kind: "date" | "address" | "matter" | "body" | "signoff";
  text: string;
};

const DATE_RE =
  /^(?:\{\{today\}\}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})$/i;
const MATTER_RE =
  /^(Re:|Insured:|Client:|Policy(?:\s+No\.?)?:|Claim(?:\s+No\.?)?:|Carrier Claim:|Date:|Date of Loss:|Loss Location:|Loss:|Our File:|Blackline File:|Location:|File:|DOL )/i;
const SIGNOFF_RE =
  /^(Respectfully|Sincerely|Very truly yours|Yours truly|Best regards)\b/i;
const SIG_LINE_RE =
  /^(Client signature|Signature:|Assignor:|Print name:)/i;

export function layoutLetterSections(body: string): LetterSection[] {
  const paras = stripLegacyFirmHeader(body)
    .trim()
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections: LetterSection[] = [];
  let i = 0;
  const firstLine = paras[0]?.split("\n")[0]?.trim() ?? "";
  if (paras[0] && DATE_RE.test(firstLine) && !paras[0].includes("\n")) {
    sections.push({ kind: "date", text: paras[0] });
    i = 1;
  }

  let signAt = paras.findIndex((p, idx) => idx >= i && SIGNOFF_RE.test(p));
  if (signAt < 0) {
    signAt = paras.findIndex((p, idx) => idx >= i && SIG_LINE_RE.test(p));
  }

  const middle = signAt >= 0 ? paras.slice(i, signAt) : paras.slice(i);
  const tail = signAt >= 0 ? paras.slice(signAt) : [];

  for (const para of middle) {
    const lines = para.split("\n");
    const matterIdx = lines.findIndex((l) => MATTER_RE.test(l.trim()));
    if (matterIdx >= 0) {
      const addr = lines.slice(0, matterIdx).join("\n").trim();
      const matter = lines.slice(matterIdx).join("\n").trim();
      if (addr) sections.push({ kind: "address", text: addr });
      if (matter) sections.push({ kind: "matter", text: matter });
    } else {
      sections.push({ kind: "body", text: para });
    }
  }

  if (tail.length) {
    sections.push({ kind: "signoff", text: tail.join("\n\n") });
  }

  return sections;
}

const MATTER_LINE_RE =
  /^(Re|Insured|Client|Policy(?:\s+No\.?)?|Claim(?:\s+No\.?)?|Carrier Claim|Date of Loss|Date|Loss Location|Our File|Blackline File|Location|File|Loss|DOL)\s*:?\s+(.*)$/i;

export type MatterRow = { label: string; value: string };

export function parseMatterBlock(text: string): {
  subject: string | null;
  rows: MatterRow[];
} {
  let subject: string | null = null;
  const rows: MatterRow[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(MATTER_LINE_RE);
    if (!match) {
      if (!subject) subject = line;
      else rows.push({ label: "", value: line });
      continue;
    }
    const label = match[1].replace(/\s+/g, " ").trim();
    const value = match[2].trim();
    if (/^re$/i.test(label)) {
      subject = value;
    } else {
      rows.push({ label, value });
    }
  }

  return { subject, rows };
}

export function matterBlockHtml(
  text: string,
  formatInline: (value: string) => string
): string {
  const { subject, rows } = parseMatterBlock(text);
  const subjectHtml = subject
    ? `<p class="doc-matter-subject">${formatInline(subject)}</p>`
    : "";
  const rowsHtml = rows.length
    ? `<table class="doc-matter-rows" width="100%" cellpadding="0" cellspacing="0">${rows
        .map(
          (row) =>
            `<tr><td class="doc-matter-label" valign="top">${
              row.label ? formatInline(row.label) : ""
            }</td><td class="doc-matter-value">${formatInline(row.value)}</td></tr>`
        )
        .join("")}</table>`
    : "";

  return `<table class="doc-matter" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td class="doc-re" valign="top">RE</td>
    <td class="doc-matter-body">${subjectHtml}${rowsHtml}</td>
  </tr></table>`;
}

export function letterSectionsHtml(sections: LetterSection[]): string {
  return sections
    .map((s) =>
      s.kind === "matter"
        ? matterBlockHtml(s.text, escapeHtml)
        : `<div class="doc-${s.kind}">${escapeHtml(s.text).replace(/\n/g, "<br/>")}</div>`
    )
    .join("\n");
}

function bodyHtml(body: string): string {
  const sections = layoutLetterSections(body);
  const signed = sections.some((s) => s.kind === "signoff");
  return letterSectionsHtml(sections) + (signed ? `\n${sealHtml()}` : "");
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
    @page { margin: ${LETTER_PAGE_MARGIN}; }
    html, body { background: #f4efe4; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", Times, serif;
      color: #0f1c2e;
      line-height: 1.7;
      font-size: 15px;
    }
    .lh { text-align: center; margin: 0 0 4px; }
    .lh img { display: inline-block; }
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
      text-align: center;
      margin: 0 0 36px;
    }
    p { margin: 0 0 1.05em; }
    .doc-date {
      text-align: center;
      letter-spacing: 0.04em;
      margin: 0 0 1.5em;
    }
    .doc-address { margin: 0 0 1.15em; }
    .doc-matter {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 1.7em;
    }
    .doc-re {
      width: 36px;
      padding: 12px 12px 0 0;
      font-family: "Times New Roman", Times, serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #c6a85b;
      line-height: 1.2;
    }
    .doc-matter-body {
      padding: 12px 16px;
      border: 1px solid #c6a85b;
      line-height: 1.55;
    }
    .doc-matter-subject {
      margin: 0 0 8px;
      text-align: left;
      font-weight: 700;
    }
    .doc-matter-rows { width: 100%; border-collapse: collapse; }
    .doc-matter-label {
      width: 9.25em;
      padding: 2px 18px 2px 0;
      color: #4a5560;
      text-align: left;
      white-space: nowrap;
    }
    .doc-matter-value { text-align: left; }
    .doc-body { margin: 0 0 1.05em; }
    .doc-signoff {
      text-align: center;
      margin: 2.4em 0 0;
    }
    .seal { text-align: center; margin: 18px 0 0; }
    .sign {
      text-align: center;
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
