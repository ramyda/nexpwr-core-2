import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get recent inspections, reports, and annotations for this client
    const [inspections, reports] = await Promise.all([
      prisma.inspection.findMany({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          date: true,
          status: true,
          createdAt: true,
          site: { select: { name: true } },
        },
      }),
      prisma.report.findMany({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          site: { select: { name: true } },
        },
      }),
    ]);

    // Merge into timeline
    const timeline = [
      ...inspections.map((i) => ({
        id: i.id,
        type: "inspection" as const,
        action: `Inspection at ${i.site.name}`,
        status: i.status,
        timestamp: i.createdAt,
      })),
      ...reports.map((r) => ({
        id: r.id,
        type: "report" as const,
        action: `Report for ${r.site?.name || "Unknown site"}`,
        status: r.status,
        timestamp: r.publishedAt || r.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
