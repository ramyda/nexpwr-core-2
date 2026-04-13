import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const siteId = searchParams.get("site_id");

  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (siteId) where.siteId = siteId;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { 
      inspection: { select: { date: true, status: true } },
      site: { select: { name: true } },
      client: { select: { company: true } }
    },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { inspectionId, clientId, siteId } = body;

  const report = await prisma.report.create({ 
    data: { 
      inspectionId, 
      clientId,
      siteId,
      status: "GENERATING" 
    } 
  });
  
  // Real Puppeteer generation should be triggered here
  return NextResponse.json(report, { status: 201 });
}
