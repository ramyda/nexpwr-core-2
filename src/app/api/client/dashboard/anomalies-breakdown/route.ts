import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/client/dashboard/anomalies-breakdown
 *
 * Returns anomaly type counts for the Recharts Donut Chart.
 * Groups top 5 types by count, with the rest bucketed as "Other".
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;

  try {
    const client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    if (!client) return NextResponse.json({ breakdown: [] });

    const sites = await prisma.site.findMany({
      where: { clientId: client.id, isActive: true },
      select: { id: true },
    });
    const siteIds = sites.map((s) => s.id);

    // Group annotations by type
    const typeCounts = await prisma.annotation.groupBy({
      by: ["type"],
      where: { siteId: { in: siteIds } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    if (typeCounts.length === 0) {
      return NextResponse.json({ breakdown: [] });
    }

    // Top 5 + "Other" bucket
    const CHART_COLORS = [
      "#ef4444", "#f97316", "#8b5cf6", "#10b981", "#3b82f6",
    ];

    const top5 = typeCounts.slice(0, 5).map((item, i) => ({
      name: item.type,
      value: item._count.id,
      color: CHART_COLORS[i],
    }));

    const otherCount = typeCounts.slice(5).reduce((sum, item) => sum + item._count.id, 0);
    if (otherCount > 0) {
      top5.push({ name: "Other", value: otherCount, color: "#64748b" });
    }

    return NextResponse.json({ breakdown: top5 });
  } catch (err: any) {
    console.error("[/api/client/dashboard/anomalies-breakdown]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
