import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const inspections = await prisma.thermographyInspection.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      include: {
        missions: {
          select: { id: true, name: true, imageCount: true, annotatedImageCount: true, status: true },
        },
        _count: { select: { missions: true } },
      },
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const body = await req.json();
    const { name, inspectionYear } = body;

    const inspection = await prisma.thermographyInspection.create({
      data: {
        name,
        inspectionYear: parseInt(inspectionYear),
        siteId,
      },
    });

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
