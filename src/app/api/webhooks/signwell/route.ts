import { NextRequest, NextResponse } from "next/server";
import { applyExecutedStatus } from "@/lib/actions/documents";
import {
  documentIdFromPayload,
  verifySignWellWebhook,
  type SignWellWebhookPayload,
} from "@/lib/integrations/signwell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SignWell posts document events here.
 * document_completed / document_signed → GeneratedDocument.status
 */
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as SignWellWebhookPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const verified = verifySignWellWebhook(payload);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const providerId = documentIdFromPayload(payload);
  const eventType = payload.event?.type ?? "unknown";
  if (!providerId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const request = await prisma.signatureRequest.findUnique({
    where: { providerDocumentId: providerId },
  });
  if (!request) {
    return NextResponse.json({ ok: true, unmatched: true });
  }

  await prisma.signatureEvent.create({
    data: {
      signatureRequestId: request.id,
      eventType,
      payloadJson: JSON.stringify(payload),
    },
  });

  const nextSigStatus =
    eventType === "document_completed"
      ? "completed"
      : eventType === "document_signed"
        ? "signed"
        : eventType === "document_declined"
          ? "declined"
          : eventType === "document_viewed"
            ? "viewed"
            : request.status;

  await prisma.signatureRequest.update({
    where: { id: request.id },
    data: {
      status: nextSigStatus,
      lastEventType: eventType,
      lastEventAt: new Date(),
    },
  });

  if (eventType === "document_signed") {
    await prisma.generatedDocument.update({
      where: { id: request.generatedDocumentId },
      data: { status: "signed", signedAt: new Date() },
    });
  }

  if (eventType === "document_completed") {
    const actor =
      (await prisma.staff.findFirst({
        where: { isActive: true, role: "ADMIN" },
        select: { id: true },
      })) ?? (await prisma.staff.findFirst({ where: { isActive: true }, select: { id: true } }));
    if (actor) {
      await applyExecutedStatus(request.generatedDocumentId, actor.id);
    }
  }

  return NextResponse.json({ ok: true });
}
