import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const { annotationId } = await params;
  try {
    const annotation = await prisma.thermalAnnotation.findUnique({
      where: { id: annotationId },
    });
    if (!annotation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(annotation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const { annotationId } = await params;
  try {
    const body = await req.json();
    const annotation = await prisma.thermalAnnotation.update({
      where: { id: annotationId },
      data: body,
    });
    return NextResponse.json(annotation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const { annotationId } = await params;
  try {
    await prisma.thermalAnnotation.delete({ where: { id: annotationId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
