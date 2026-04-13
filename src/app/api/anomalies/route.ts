import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const inspectionId = url.searchParams.get("inspectionId");
  const siteId = url.searchParams.get("site_id");
  const clientId = url.searchParams.get("client_id");

  const where: any = {};
  if (inspectionId) where.inspectionId = inspectionId;
  if (siteId) where.siteId = siteId;
  if (clientId) where.clientId = clientId;

  const annotations = await prisma.annotation.findMany({
    where,
    orderBy: { deltaT: "desc" },
    include: { 
      inspection: { select: { date: true } },
      site: { select: { name: true } },
      client: { select: { company: true } }
    },
  });
  return NextResponse.json(annotations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  // Ensure the body maps to the new field names
  const payload = {
    ...body,
    deltaT: body.deltaT || body.deltaTC || 0,
    tAnomaly: body.tAnomaly || body.tAnomalyC || 0,
    tReference: body.tReference || body.tReferenceC || 0,
  };
  
  // Remove old keys if present
  delete (payload as any).deltaTC;
  delete (payload as any).tAnomalyC;
  delete (payload as any).tReferenceC;

  const annotation = await prisma.annotation.create({ data: payload });
  return NextResponse.json(annotation, { status: 201 });
}
