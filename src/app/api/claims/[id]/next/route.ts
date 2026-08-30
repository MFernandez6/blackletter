import { NextRequest, NextResponse } from "next/server";
import { getSession, isServiceKey } from "@/lib/auth";
import { nextDocumentForClaim } from "@/lib/next-document";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user && !isServiceKey(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await nextDocumentForClaim({
    claimId: params.id,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  });
  if (!result) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }
  return NextResponse.json(result);
}
