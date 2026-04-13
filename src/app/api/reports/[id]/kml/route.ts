import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import tokml from "tokml";

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
            site: true,
            client: true,
            annotations: true,
          },
        },
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const annotations = report.inspection?.annotations || [];

    // Map to GeoJSON for tokml
    const geojson: any = {
      type: "FeatureCollection",
      features: annotations.map((ann: any) => {
        // Handle polygonPoints if present, otherwise fallback to Point
        let geometry: any = {
          type: "Point",
          coordinates: [ann.lng, ann.lat]
        };

        if (ann.polygonPoints) {
           try {
             const points = typeof ann.polygonPoints === 'string' 
                ? JSON.parse(ann.polygonPoints) 
                : ann.polygonPoints;
             if (Array.isArray(points) && points.length > 0) {
                geometry = {
                  type: "Polygon",
                  coordinates: [points.map((p: any) => [p.lng, p.lat])]
                };
             }
           } catch (e) {
             console.error("Failed to parse polygon points for KML:", e);
           }
        }

        // Color coding for tokml (simplistic, tokml supports style tags via geojson props)
        const colorMap: any = {
          C4: "#ff0000",
          C3: "#ffa500",
          C2: "#0000ff",
          C1: "#008000"
        };
        const color = colorMap[ann.iecClass] || "#888888";

        return {
          type: "Feature",
          geometry,
          properties: {
            name: `${ann.type} (${ann.iecClass})`,
            description: `Type: ${ann.type}\nClass: ${ann.iecClass}\nDeltaT: ${ann.deltaT}C\nLocation: ${ann.locationString || 'N/A'}`,
            "marker-color": color,
            stroke: color,
            fill: color,
            "fill-opacity": 0.3
          }
        };
      })
    };

    const kmlContent = tokml(geojson, {
      name: `NexPwr Report - ${id}`,
      description: "Solar Anomaly Inspection Annotations"
    });

    return new NextResponse(kmlContent, {
      headers: {
        "Content-Type": "application/vnd.google-earth.kml+xml",
        "Content-Disposition": `attachment; filename=report_${id}.kml`,
      },
    });
  } catch (error: any) {
    console.error("KML Export failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
