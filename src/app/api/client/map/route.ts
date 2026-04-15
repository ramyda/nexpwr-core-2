import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSeverityFromDelta } from "@/lib/constants";

/**
 * GET /api/client/map
 *
 * Returns map layers (Thermal/RGB TIFF storage URLs) and all annotation
 * polygons for the client's sites with full diagnostic data for the sidebar.
 *
 * Query params:
 *   siteId?: string — filter to a specific site (optional)
 *   inspectionId?: string — filter to a specific inspection (optional)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;
  const { searchParams } = new URL(req.url);
  const siteIdFilter = searchParams.get("siteId");
  const inspectionIdFilter = searchParams.get("inspectionId");

  try {
    const client = clientId
      ? await prisma.client.findUnique({ where: { id: clientId } })
      : await prisma.client.findUnique({ where: { email: session.user?.email ?? "" } });

    if (!client) {
      return NextResponse.json({ layers: [], anomalies: [], sites: [] });
    }

    // ---- Sites list (for dropdown) ----
    const sites = await prisma.site.findMany({
      where: { clientId: client.id, isActive: true },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    const allowedSiteIds = sites.map((s) => s.id);
    const siteIds = siteIdFilter ? [siteIdFilter] : allowedSiteIds;

    // ---- Inspections with file paths ----
    const inspections = await prisma.inspection.findMany({
      where: {
        clientId: client.id,
        siteId: { in: siteIds },
        ...(inspectionIdFilter ? { id: inspectionIdFilter } : {}),
      },
      select: {
        id: true,
        thermalFilePath: true,
        visualFilePath: true,
        thermalPreviewUrl: true,
        siteId: true,
        date: true,
        status: true,
      },
      orderBy: { date: "desc" },
    });

    // Build map layer references from inspections
    const layers = inspections.flatMap((insp) => {
      const result = [];
      if (insp.thermalFilePath) {
        result.push({
          inspectionId: insp.id,
          siteId: insp.siteId,
          type: "Thermal_TIFF",
          url: insp.thermalFilePath,
          previewUrl: insp.thermalPreviewUrl,
          date: insp.date,
        });
      }
      if (insp.visualFilePath) {
        result.push({
          inspectionId: insp.id,
          siteId: insp.siteId,
          type: "RGB_Ortho",
          url: insp.visualFilePath,
          date: insp.date,
        });
      }
      return result;
    });

    // ---- Annotations (with loss data) ----
    const annotations = await prisma.annotation.findMany({
      where: {
        siteId: { in: siteIds },
        ...(inspectionIdFilter ? { inspectionId: inspectionIdFilter } : {}),
      },
      include: {
        inspection: {
          select: { date: true, thermalPreviewUrl: true },
        },
        site: {
          select: { name: true },
        },
      },
      orderBy: { deltaT: "desc" },
    });

    const anomalies = annotations.map((ann) => {
      const severity = getSeverityFromDelta(ann.deltaT);
      const severityColor =
        severity === "critical"        ? "#ef4444"
        : severity === "moderate"     ? "#f59e0b"
        : severity === "minor"        ? "#10b981"
        : "#71717a";

      return {
        id: ann.id,
        type: ann.type,
        iecClass: ann.iecClass,
        severity,
        severityColor,
        status: ann.status,
        deltaT: ann.deltaT,
        tAnomaly: ann.tAnomaly,
        tReference: ann.tReference,
        lat: ann.lat,
        lng: ann.lng,
        polygonPoints: ann.polygonPoints,
        modulesAffected: ann.modulesAffected,
        notes: ann.notes,
        locationString: ann.locationString,
        lossResults: ann.lossResults,
        calculatedAt: ann.calculatedAt,
        inspectionDate: ann.inspection?.date,
        thermalPreviewUrl: ann.inspection?.thermalPreviewUrl,
        siteName: ann.site?.name,
        inspectionId: ann.inspectionId,
        siteId: ann.siteId,
      };
    });

    return NextResponse.json({ layers, anomalies, sites, inspections });
  } catch (err: any) {
    console.error("[/api/client/map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
