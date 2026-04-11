import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { inspection: { select: { date: true, site: { select: { name: true } } } } },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { inspectionId } = await req.json();
  const report = await prisma.report.create({ data: { inspectionId, status: "GENERATING" } });
  // In production: trigger background job here (Puppeteer PDF generation etc.)
  return NextResponse.json(report, { status: 201 });
}
