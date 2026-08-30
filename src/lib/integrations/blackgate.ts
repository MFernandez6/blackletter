import type { IntakeOnFile } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

/**
 * Pull intake documents already collected in BLACKGATE so BLACKLETTER
 * does not regenerate a signed LOR / contract / disclosure.
 */
export async function pullBlackgateOnFile(opts: {
  claimMirrorId: string;
  claimNumber: string;
  intakeNumber?: string | null;
}): Promise<IntakeOnFile[]> {
  const cached = await prisma.claimMirror.findUnique({
    where: { id: opts.claimMirrorId },
    select: { intakeDocumentsJson: true },
  });
  const local = parseJson<IntakeOnFile[]>(cached?.intakeDocumentsJson ?? "[]", []);

  const base = process.env.BLACKGATE_API_URL?.replace(/\/$/, "");
  const key = process.env.BLACKGATE_API_KEY;
  if (!base || !key) return local;

  try {
    const params = new URLSearchParams();
    if (opts.intakeNumber) params.set("intakeNumber", opts.intakeNumber);
    params.set("claimNumber", opts.claimNumber);
    const res = await fetch(`${base}/api/intakes/documents?${params}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { documents?: IntakeOnFile[] };
    const docs = data.documents ?? [];
    await prisma.claimMirror.update({
      where: { id: opts.claimMirrorId },
      data: { intakeDocumentsJson: JSON.stringify(docs) },
    });
    return docs;
  } catch {
    return local;
  }
}
