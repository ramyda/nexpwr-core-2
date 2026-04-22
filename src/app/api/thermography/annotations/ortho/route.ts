import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("missionId");

  if (!missionId) {
    return NextResponse.json({ error: "missionId required" }, { status: 400 });
  }

  try {
    const annotations = await prisma.thermalAnnotation.findMany({
      where: { missionId, orthoAnnotation: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(annotations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const annotation = await prisma.thermalAnnotation.create({
      data: {
        ...body,
        orthoAnnotation: true,
        x: body.x || 0,
        y: body.y || 0,
        width: body.width || 0,
        height: body.height || 0,
      },
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Error creating ortho annotation:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
