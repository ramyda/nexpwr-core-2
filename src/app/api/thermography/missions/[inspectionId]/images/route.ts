import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params;
  try {
    // First get the mission's inspection to find the right missions
    const missions = await prisma.thermographyMission.findMany({
      where: { inspectionId },
    });

    // Get images for all missions under this inspection
    const missionIds = missions.map((m) => m.id);
    const images = await prisma.thermalImage.findMany({
      where: { missionId: { in: missionIds } },
      orderBy: { filename: "asc" },
      select: {
        id: true,
        missionId: true,
        filename: true,
        s3Url: true,
        reviewed: true,
        isFaulty: true,
        annotationsCount: true,
      },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId } = await params;
  try {
    const body = await req.json();
    const { filenames, s3Keys, missionId } = body;

    if (!filenames || !Array.isArray(filenames)) {
      return NextResponse.json({ error: "filenames array required" }, { status: 400 });
    }

    // Bulk create ThermalImage records
    const targetMissionId = missionId || inspectionId;
    const data = filenames.map((filename: string, i: number) => ({
      missionId: targetMissionId,
      filename,
      s3Url: s3Keys?.[i] || null,
    }));

    const result = await prisma.thermalImage.createMany({ data });

    // Update mission imageCount
    await prisma.thermographyMission.update({
      where: { id: targetMissionId },
      data: { imageCount: filenames.length },
    });

    return NextResponse.json({
      created: result.count,
      imageCount: filenames.length,
    });
  } catch (error) {
    console.error("Error creating images:", error);
    return NextResponse.json({ error: "Failed to create images" }, { status: 500 });
  }
}
