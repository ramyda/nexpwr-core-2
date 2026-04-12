import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientId, name, location, capacityMw, modules, 
      inverter, mountType, ppaRate, performanceRatio 
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const site = await prisma.site.create({
      data: {
        clientId,
        name,
        location,
        capacityMw: parseFloat(capacityMw),
        modules: modules ? parseInt(modules) : null,
        inverter,
        mountType,
        ppaRate: ppaRate ? parseFloat(ppaRate) : null,
        performanceRatio: performanceRatio ? parseFloat(performanceRatio) : null,
      }
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        client: true,
        inspections: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }
}
