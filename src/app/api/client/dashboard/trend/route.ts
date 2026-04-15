import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;
  if (!clientId) return NextResponse.json({ error: "No organization associated" }, { status: 403 });

  try {
    // Fetch all metrics for this client, including inspection date
    const metrics = await prisma.siteMetric.findMany({
      where: {
        site: { clientId }
      },
      include: {
        inspection: {
          select: { date: true }
        }
      },
      orderBy: {
        inspection: { date: "asc" }
      }
    });

    // Aggregate by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap: Record<string, { date: string; powerLoss: number; anomalies: number; sortKey: number }> = {};

    metrics.forEach(m => {
      const d = new Date(m.inspection.date);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const monthName = months[monthIdx];
      const key = `${year}-${monthIdx}`;

      if (!trendMap[key]) {
        trendMap[key] = { 
          date: monthName, 
          powerLoss: 0, 
          anomalies: 0,
          sortKey: year * 100 + monthIdx
        };
      }

      trendMap[key].powerLoss += m.totalPowerLossKwp;
      trendMap[key].anomalies += m.totalAnomalyCount;
    });

    // Sort and format for Recharts
    const trendData = Object.values(trendMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ date, powerLoss, anomalies }) => ({
        date,
        powerLoss: Math.round(powerLoss),
        anomalies
      }));

    // If empty, provide some default labels for the last 6 months with 0s
    if (trendData.length === 0) {
      const last6 = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6.push({
          date: months[d.getMonth()],
          powerLoss: 0,
          anomalies: 0
        });
      }
      return NextResponse.json(last6);
    }

    return NextResponse.json(trendData);
  } catch (error: any) {
    console.error("Trend API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
