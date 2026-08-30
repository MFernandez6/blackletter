import { NextRequest, NextResponse } from "next/server";
import { getSession, isServiceKey } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user && !isServiceKey(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intakeNumber = req.nextUrl.searchParams.get("intakeNumber");
  if (!intakeNumber) {
    return NextResponse.json({ error: "intakeNumber required" }, { status: 400 });
  }

  const claims = await prisma.claimMirror.findMany({
    where: { intakeNumber },
    include: {
      documents: {
        orderBy: { generatedAt: "desc" },
        select: {
          id: true,
          documentType: true,
          title: true,
          status: true,
          generatedAt: true,
          fileUrl: true,
          claimNumber: true,
        },
      },
    },
  });

  return NextResponse.json({
    intakeNumber,
    documents: claims.flatMap((c) => c.documents),
  });
}
