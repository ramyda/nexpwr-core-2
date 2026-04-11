import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      inspection: {
        include: {
          site: true,
          anomalies: { orderBy: { deltaTC: "desc" } },
        },
      },
    },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { anomalies, site, date } = report.inspection;

  const headers = [
    "ID", "Type", "IEC Class", "ΔT (°C)", "T Anomaly (°C)", "T Reference (°C)",
    "Location", "Priority", "Modules Affected", "Status", "Lat", "Lng",
    "Notes", "Inspection Date", "Site Name", "Site Location",
  ];

  const rows = anomalies.map((a) => [
    a.id,
    a.type,
    a.iecClass,
    a.deltaTC.toFixed(2),
    a.tAnomalyC.toFixed(2),
    a.tReferenceC.toFixed(2),
    a.locationString || "",
    a.priority || "",
    a.modulesAffected,
    a.status,
    a.lat ?? "",
    a.lng ?? "",
    (a.notes || "").replace(/,/g, ";"),
    new Date(date).toISOString().split("T")[0],
    site.name,
    site.location,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="nexpwr-report-${id.slice(0, 8)}.csv"`,
    },
  });
}
