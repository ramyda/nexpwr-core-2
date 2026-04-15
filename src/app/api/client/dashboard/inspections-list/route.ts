import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/client/dashboard/inspections-list
 *
 * Returns a paginated list of inspections for the client's sites,
 * each enriched with its SiteMetric rollup data for the dashboard table.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const skip = (page - 1) * pageSize;

  try {
    const client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    if (!client) return NextResponse.json({ inspections: [], total: 0 });

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where: { clientId: client.id },
        include: {
          site: {
            select: { name: true, location: true, capacityMw: true, capacityAcMw: true },
          },
          metrics: {
            orderBy: { calculatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.inspection.count({ where: { clientId: client.id } }),
    ]);

    const result = inspections.map((insp) => {
      const metric = insp.metrics[0] ?? null;
      return {
        id: insp.id,
        date: insp.date,
        status: insp.status,
        siteName: insp.site.name,
        siteLocation: insp.site.location,
        dcCapacityMw: insp.site.capacityMw,
        acCapacityMw: insp.site.capacityAcMw,
        // Metric rollup (null if not yet calculated)
        totalPowerLossKwp: metric?.totalPowerLossKwp ?? null,
        totalRevenueLoss: metric?.totalRevenueLoss ?? null,
        totalAnomalyCount: metric?.totalAnomalyCount ?? null,
        criticalCount: metric?.criticalCount ?? null,
        moderateCount: metric?.moderateCount ?? null,
        minorCount: metric?.minorCount ?? null,
      };
    });

    return NextResponse.json({ inspections: result, total, page, pageSize });
  } catch (err: any) {
    console.error("[/api/client/dashboard/inspections-list]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
