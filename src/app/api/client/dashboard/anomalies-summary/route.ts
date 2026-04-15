import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/client/dashboard/anomalies-summary
 *
 * Returns aggregated anomaly breakdown for the 3-tab progress bar:
 *   - severity: critical / moderate / minor / not_significant
 *   - status:   open / resolved / in_progress / false_positive / not_found
 *   - iec:      classA / classB / classC / classD
 *
 * Reads from SiteMetric rollup for O(1) per-site lookups.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;

  try {
    const client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    if (!client) return NextResponse.json(buildEmptySummary());

    const sites = await prisma.site.findMany({
      where: { clientId: client.id, isActive: true },
      select: { id: true },
    });
    const siteIds = sites.map((s) => s.id);

    // Most recent metric per site
    const metrics = await prisma.siteMetric.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { calculatedAt: "desc" },
      distinct: ["siteId"],
    });

    // Roll up across all sites
    const totals = metrics.reduce(
      (acc, m) => ({
        critical: acc.critical + m.criticalCount,
        moderate: acc.moderate + m.moderateCount,
        minor: acc.minor + m.minorCount,
        notSignificant: acc.notSignificant + m.notSignificantCount,
        pending: acc.pending + m.pendingCount,
        resolved: acc.resolved + m.resolvedCount,
        inProgress: acc.inProgress + m.inProgressCount,
        falsePositive: acc.falsePositive + m.falsePositiveCount,
        notFound: acc.notFound + m.notFoundCount,
        iecA: acc.iecA + m.iecClassA,
        iecB: acc.iecB + m.iecClassB,
        iecC: acc.iecC + m.iecClassC,
        iecD: acc.iecD + m.iecClassD,
        total: acc.total + m.totalAnomalyCount,
      }),
      {
        critical: 0, moderate: 0, minor: 0, notSignificant: 0,
        pending: 0, resolved: 0, inProgress: 0, falsePositive: 0, notFound: 0,
        iecA: 0, iecB: 0, iecC: 0, iecD: 0, total: 0,
      }
    );

    const t = totals.total || 1; // avoid /0
    const pct = (n: number) => parseFloat(((n / t) * 100).toFixed(2));

    return NextResponse.json({
      total: totals.total,
      severity: [
        { label: "Critical", count: totals.critical, percentage: pct(totals.critical), color: "bg-red-500" },
        { label: "Moderate", count: totals.moderate, percentage: pct(totals.moderate), color: "bg-yellow-500" },
        { label: "Minor",    count: totals.minor,    percentage: pct(totals.minor),    color: "bg-emerald-500" },
        { label: "Not Significant", count: totals.notSignificant, percentage: pct(totals.notSignificant), color: "bg-zinc-500" },
      ],
      status: [
        { label: "Pending",       count: totals.pending,       percentage: pct(totals.pending),       color: "bg-[#71b1d9]" },
        { label: "In Progress",   count: totals.inProgress,    percentage: pct(totals.inProgress),    color: "bg-yellow-500" },
        { label: "Not Found",     count: totals.notFound,      percentage: pct(totals.notFound),      color: "bg-blue-600" },
        { label: "False +ve",     count: totals.falsePositive, percentage: pct(totals.falsePositive), color: "bg-purple-500" },
        { label: "Resolved",      count: totals.resolved,      percentage: pct(totals.resolved),      color: "bg-emerald-500" },
      ],
      iec: [
        { label: "Class A (ΔT ≥ 20°C)", count: totals.iecA, percentage: pct(totals.iecA), color: "bg-red-500" },
        { label: "Class B (10-20°C)",    count: totals.iecB, percentage: pct(totals.iecB), color: "bg-orange-500" },
        { label: "Class C (3-10°C)",     count: totals.iecC, percentage: pct(totals.iecC), color: "bg-yellow-500" },
        { label: "Class D (< 3°C)",      count: totals.iecD, percentage: pct(totals.iecD), color: "bg-zinc-500" },
      ],
    });
  } catch (err: any) {
    console.error("[/api/client/dashboard/anomalies-summary]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildEmptySummary() {
  const empty = (labels: string[], colors: string[]) =>
    labels.map((label, i) => ({ label, count: 0, percentage: 0, color: colors[i] }));
  return {
    total: 0,
    severity: empty(["Critical","Moderate","Minor","Not Significant"], ["bg-red-500","bg-yellow-500","bg-emerald-500","bg-zinc-500"]),
    status:   empty(["Pending","In Progress","Not Found","False +ve","Resolved"], ["bg-[#71b1d9]","bg-yellow-500","bg-blue-600","bg-purple-500","bg-emerald-500"]),
    iec:      empty(["Class A","Class B","Class C","Class D"], ["bg-red-500","bg-orange-500","bg-yellow-500","bg-zinc-500"]),
  };
}
