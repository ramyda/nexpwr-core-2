import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { deltaT, tAnomaly, tReference, ...rest } = body;

  try {
    const annotation = await prisma.annotation.update({
      where: { id },
      data: {
        ...rest,
        deltaT: deltaT ? parseFloat(deltaT) : undefined,
        tAnomaly: tAnomaly ? parseFloat(tAnomaly) : undefined,
        tReference: tReference ? parseFloat(tReference) : undefined,
      },
    });

    return NextResponse.json(annotation);
  } catch (error: any) {
    console.error("Failed to update annotation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.annotation.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete annotation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
