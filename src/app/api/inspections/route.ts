import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inspections = await prisma.inspection.findMany({
    orderBy: { date: "desc" },
    include: {
      site: { select: { name: true, location: true } },
      _count: { select: { anomalies: true } },
    },
  });
  return NextResponse.json(inspections);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { siteId, date, ...rest } = body;

  const inspection = await prisma.inspection.create({
    data: {
      siteId,
      date: new Date(date),
      ...rest,
    },
  });
  return NextResponse.json(inspection, { status: 201 });
}
