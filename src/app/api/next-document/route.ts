import { NextRequest, NextResponse } from "next/server";
import { getSession, isServiceKey } from "@/lib/auth";
import { nextDocumentForClaim } from "@/lib/next-document";
import { CLAIM_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Suite-wide: what document does this claim need next?
 * Callable from BLACKBOX claim detail (service key or staff session).
 *
 * GET /api/next-document?claimId=&claimNumber=&status=&aobApplicable=
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user && !isServiceKey(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const claimId = url.searchParams.get("claimId") ?? undefined;
  const claimNumber = url.searchParams.get("claimNumber") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const aobRaw = url.searchParams.get("aobApplicable");

  if (status && !CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])) {
    return NextResponse.json({ error: "Unknown claim status." }, { status: 400 });
  }

  const result = await nextDocumentForClaim({
    claimId,
    claimNumber,
    status,
    aobApplicable:
      aobRaw === "true" ? true : aobRaw === "false" ? false : undefined,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Provide claimId or claimNumber (and status if the file is not mirrored yet)." },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
