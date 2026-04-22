import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params;
  try {
    const inspection = await prisma.thermographyInspection.findUnique({
      where: { id: inspectionId },
      include: {
        site: {
          include: {
            client: { select: { id: true, name: true, company: true } },
          },
        },
        missions: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { images: true } },
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json({ error: "Failed to fetch inspection" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params;
  try {
    const body = await req.json();
    const { name, blockName } = body;

    const mission = await prisma.thermographyMission.create({
      data: {
        name,
        blockName: blockName || null,
        inspectionId,
      },
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error("Error creating mission:", error);
    return NextResponse.json({ error: "Failed to create mission" }, { status: 500 });
  }
}
