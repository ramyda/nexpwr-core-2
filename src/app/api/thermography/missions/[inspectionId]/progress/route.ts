import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Note: the URL slug is [inspectionId] but this endpoint accepts a missionId value
// to avoid Next.js slug name conflicts in the /api/thermography/missions/ tree
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const { inspectionId: missionId } = await params;
  try {
    const body = await req.json();
    const increment = body.increment || 1;

    const mission = await prisma.thermographyMission.update({
      where: { id: missionId },
      data: {
        annotatedImageCount: { increment },
      },
      select: {
        id: true,
        annotatedImageCount: true,
        imageCount: true,
      },
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
