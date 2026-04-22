import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      thermographySiteCount,
      siteCount,
      activeThermographyAudits,
      activeInspections,
      anomalyCount,
      recentReports,
      activeMissions,
      recentActivity,
    ] = await Promise.all([
      prisma.thermographySite.count(),
      prisma.site.count(),
      prisma.thermographyAudit.count({ where: { status: "in_progress" } }),
      prisma.inspection.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "DRAFT"] } } }),
      prisma.thermalAnnotation.count({
        where: { severity: { in: ["High", "Critical", "Medium"] } },
      }),
      prisma.report.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.thermographyAudit.count({ where: { status: "in_progress" } }),
      // Get recent activity across the system
      prisma.inspection.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          status: true,
          site: { select: { name: true } },
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalSites: thermographySiteCount + siteCount,
      activeInspections: activeThermographyAudits + activeInspections,
      totalAnomalies: anomalyCount,
      reportsGenerated: recentReports,
      activeMissions,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        clientId: a.client?.id,
        clientName: a.client?.name || "Unknown",
        action: `Inspection at ${a.site.name} — ${a.status}`,
        type: "inspection",
        timestamp: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
