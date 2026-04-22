import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const site = await prisma.thermographySite.findUnique({
      where: { id: siteId },
      include: {
        client: { select: { id: true, name: true, company: true } },
        inspections: {
          orderBy: { createdAt: "desc" },
          include: {
            missions: {
              select: { id: true, name: true, imageCount: true, status: true },
            },
          },
        },
        audits: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const body = await req.json();
    const site = await prisma.thermographySite.update({
      where: { id: siteId },
      data: body,
    });
    return NextResponse.json(site);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    await prisma.thermographySite.delete({ where: { id: siteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
  }
}
