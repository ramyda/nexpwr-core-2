import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sites = await prisma.thermographySite.findMany({
      include: {
        client: { select: { id: true, name: true, company: true } },
        audits: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, name: true },
        },
        _count: { select: { inspections: true, audits: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching thermography sites:", error);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, clientId, projectCode, latitude, longitude,
      acCapacity, dcCapacity, acUnit, dcUnit, moduleType,
      mountType, commissionedDate, landAreaAcres, address,
      country, state,
    } = body;

    const site = await prisma.thermographySite.create({
      data: {
        name,
        clientId: clientId || null,
        projectCode: projectCode || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        acCapacity: acCapacity ? parseFloat(acCapacity) : null,
        dcCapacity: dcCapacity ? parseFloat(dcCapacity) : null,
        acUnit: acUnit || "MW",
        dcUnit: dcUnit || "MW",
        moduleType: moduleType || null,
        mountType: mountType || null,
        commissionedDate: commissionedDate ? new Date(commissionedDate) : null,
        landAreaAcres: landAreaAcres ? parseFloat(landAreaAcres) : null,
        address: address || null,
        country: country || null,
        state: state || null,
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error creating thermography site:", error);
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }
}
