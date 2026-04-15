import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runCalculationForInspection } from "@/lib/calculationEngine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inspectionId = searchParams.get("inspection_id");

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspection_id" }, { status: 400 });
  }

  const annotations = await prisma.annotation.findMany({
    where: { inspectionId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(annotations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { 
    inspectionId, 
    clientId, 
    siteId, 
    type, 
    iecClass, 
    deltaT, 
    tAnomaly, 
    tReference, 
    ...rest 
  } = body;

  if (!inspectionId || !type || !iecClass) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const annotation = await prisma.annotation.create({
      data: {
        inspectionId,
        clientId,
        siteId,
        type,
        iecClass,
        deltaT: parseFloat(deltaT),
        tAnomaly: parseFloat(tAnomaly),
        tReference: parseFloat(tReference),
        ...rest,
      },
    });

    // Update inspection status to IN_PROGRESS if it's currently UPLOADED
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { status: true },
    });

    if (inspection?.status === "UPLOADED") {
      await prisma.inspection.update({
        where: { id: inspectionId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Trigger calculation engine asynchronously (non-blocking)
    runCalculationForInspection(inspectionId).catch((e) =>
      console.error("[annotations/POST] calculation failed:", e)
    );

    return NextResponse.json(annotation, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create annotation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "Missing annotation id" }, { status: 400 });

  try {
    const annotation = await prisma.annotation.update({
      where: { id },
      data,
    });

    // Trigger calculation engine asynchronously (non-blocking)
    if (annotation.inspectionId) {
      runCalculationForInspection(annotation.inspectionId).catch((e) =>
        console.error("[annotations/PUT] calculation failed:", e)
      );
    }

    return NextResponse.json(annotation);
  } catch (error: any) {
    console.error("Failed to update annotation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing annotation id" }, { status: 400 });

  try {
    await prisma.annotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete annotation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
