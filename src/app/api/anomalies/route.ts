import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const inspectionId = url.searchParams.get("inspectionId");

  const where = inspectionId ? { inspectionId } : {};
  const anomalies = await prisma.anomaly.findMany({
    where,
    orderBy: { deltaTC: "desc" },
    include: { inspection: { select: { date: true, site: { select: { name: true } } } } },
  });
  return NextResponse.json(anomalies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const anomaly = await prisma.anomaly.create({ data: body });
  return NextResponse.json(anomaly, { status: 201 });
}
