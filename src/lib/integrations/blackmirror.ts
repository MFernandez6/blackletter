import type { MirrorScope } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

export async function pullBlackmirrorScope(opts: {
  claimMirrorId: string;
  blackboxClaimId: string;
}): Promise<MirrorScope> {
  const cached = await prisma.claimMirror.findUnique({
    where: { id: opts.claimMirrorId },
    select: { mirrorScopeJson: true },
  });
  const local = parseJson<MirrorScope>(cached?.mirrorScopeJson ?? "{}", {});

  const base = process.env.BLACKMIRROR_API_URL?.replace(/\/$/, "");
  const key = process.env.BLACKMIRROR_API_KEY;
  if (!base || !key) return local;

  try {
    const res = await fetch(
      `${base}/api/inspections/by-claim?claimId=${encodeURIComponent(opts.blackboxClaimId)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return local;
    const data = (await res.json()) as MirrorScope;
    await prisma.claimMirror.update({
      where: { id: opts.claimMirrorId },
      data: { mirrorScopeJson: JSON.stringify(data) },
    });
    return data;
  } catch {
    return local;
  }
}
