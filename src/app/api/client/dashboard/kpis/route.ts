import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/client/dashboard/kpis
 *
 * Returns aggregated portfolio metrics for the logged-in client's organization.
 * Reads from SiteMetric rollup table (fast — no aggregation at query time).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;

  try {
    // Resolve client by clientId in session or by email fallback
    let client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    if (!client) {
      return NextResponse.json({
        totalDcCapacityMw: 0, totalAcCapacityMw: 0,
        totalPowerLossKwp: 0, totalRevenueLoss: 0,
        siteCount: 0, inspectionCount: 0, totalAnomalyCount: 0,
      });
    }

    // Fetch all sites for KPI capacity figures
    const sites = await prisma.site.findMany({
      where: { clientId: client.id, isActive: true },
      select: { id: true, capacityMw: true, capacityAcMw: true },
    });

    const siteIds = sites.map((s) => s.id);
    const totalDcCapacityMw = sites.reduce((sum, s) => sum + (s.capacityMw ?? 0), 0);
    const totalAcCapacityMw = sites.reduce((sum, s) => sum + (s.capacityAcMw ?? 0), 0);

    // Aggregate SiteMetric rollup — most recent metric per site
    const metrics = await prisma.siteMetric.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { calculatedAt: "desc" },
      distinct: ["siteId"],
    });

    const totalPowerLossKwp = metrics.reduce((s, m) => s + m.totalPowerLossKwp, 0);
    const totalRevenueLoss = metrics.reduce((s, m) => s + m.totalRevenueLoss, 0);
    const totalAnomalyCount = metrics.reduce((s, m) => s + m.totalAnomalyCount, 0);

    const inspectionCount = await prisma.inspection.count({
      where: { clientId: client.id },
    });

    return NextResponse.json({
      totalDcCapacityMw,
      totalAcCapacityMw,
      totalPowerLossKwp,
      totalRevenueLoss,
      siteCount: sites.length,
      inspectionCount,
      totalAnomalyCount,
    });
  } catch (err: any) {
    console.error("[/api/client/dashboard/kpis]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
