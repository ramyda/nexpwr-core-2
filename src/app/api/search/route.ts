import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({
      clients: [],
      sites: [],
      thermographyInspections: [],
      audits: [],
      inspections: [],
    });
  }

  try {
    const [clients, sites, thermographyInspections, audits, inspections] =
      await Promise.all([
        // Search clients
        prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            company: true,
            isActive: true,
            _count: { select: { thermographySites: true, sites: true } },
          },
        }),

        // Search thermography sites
        prisma.thermographySite.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { projectCode: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            address: true,
            clientId: true,
            client: { select: { name: true } },
          },
        }),

        // Search thermography inspections
        prisma.thermographyInspection.findMany({
          where: {
            name: { contains: q, mode: "insensitive" },
          },
          take: 5,
          select: {
            id: true,
            name: true,
            inspectionYear: true,
            siteId: true,
            site: { select: { name: true, id: true } },
          },
        }),

        // Search thermography audits
        prisma.thermographyAudit.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { groupId: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            status: true,
            totalModulesInspected: true,
            site: { select: { name: true, clientId: true } },
          },
        }),

        // Search existing inspections
        prisma.inspection.findMany({
          where: {
            OR: [
              { site: { name: { contains: q, mode: "insensitive" } } },
              { operator: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: {
            id: true,
            date: true,
            status: true,
            siteId: true,
            site: { select: { name: true } },
            client: { select: { name: true, id: true } },
          },
        }),
      ]);

    return NextResponse.json({
      clients,
      sites,
      thermographyInspections,
      audits,
      inspections,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
