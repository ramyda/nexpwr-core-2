import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        inspection: {
          include: {
            annotations: true,
            site: true,
            client: true,
          },
        },
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const { inspection } = report;
    const { site, client, annotations } = inspection!;

    // CSV Headers
    const headers = [
      "ID", "Type", "IEC Class", "Delta T (C)", "T Anomaly", "T Reference", 
      "Location", "Priority", "Modules Affected", "DC Loss (kW)", 
      "Annual kWh", "Annual $ Loss", "Lat", "Lng", "Inspection Date", 
      "Site Name", "Client Name"
    ];

    const rows = annotations.map((ann: any, idx: number) => {
      const dcLoss = ann.iecClass === "C4" ? 1.0 : ann.iecClass === "C3" ? 0.5 : ann.iecClass === "C2" ? 0.2 : 0.1;
      const annualKwh = dcLoss * (site?.annualPoa || 1800) * (site?.performanceRatio || 0.82);
      const annualUsd = annualKwh * (site?.ppaRate || 0.10);

      return [
        `ANN-${String(idx + 1).padStart(3, "0")}`,
        ann.type,
        ann.iecClass,
        ann.deltaT,
        ann.tAnomaly,
        ann.tReference,
        `"${ann.locationString || ""}"`,
        ann.priority || "Normal",
        ann.modulesAffected,
        dcLoss.toFixed(2),
        Math.round(annualKwh),
        Math.round(annualUsd),
        ann.lat,
        ann.lng,
        new Date(inspection!.date).toLocaleDateString(),
        `"${site?.name}"`,
        `"${client?.company}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=report_${id}.csv`,
      },
    });
  } catch (error: any) {
    console.error("CSV Export failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
