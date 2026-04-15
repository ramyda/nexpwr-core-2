import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runCalculationForInspection } from "@/lib/calculationEngine";

/**
 * PATCH /api/client/map/[id]/status
 *
 * Allows a client to update the status of an annotation.
 * Valid transitions: OPEN → RESOLVED / FALSE_POSITIVE / IN_PROGRESS / NOT_FOUND
 *
 * Triggers a lightweight metric recalculation after the update.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;
  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body as { status: string };

    const VALID_STATUSES = ["OPEN", "RESOLVED", "FALSE_POSITIVE", "IN_PROGRESS", "NOT_FOUND"];
    if (!VALID_STATUSES.includes(status.toUpperCase())) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Verify the annotation belongs to this client's organization
    const annotation = await prisma.annotation.findUnique({
      where: { id },
      select: { id: true, clientId: true, inspectionId: true, inspection: { select: { clientId: true } } },
    });

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    // Resolve client from session
    const client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    // Scope check — only allow if annotation belongs to client's org
    const annotationClientId = annotation.clientId ?? annotation.inspection?.clientId;
    if (client && annotationClientId && annotationClientId !== client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the status
    const updated = await prisma.annotation.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    // Re-run metrics in the background (non-blocking)
    runCalculationForInspection(annotation.inspectionId).catch((e) =>
      console.error("[status/PATCH] metric recalc failed:", e)
    );

    return NextResponse.json({ success: true, annotation: updated });
  } catch (err: any) {
    console.error("[/api/client/map/[id]/status]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
