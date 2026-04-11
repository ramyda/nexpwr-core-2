import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      site: true,
      anomalies: { orderBy: { deltaTC: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inspection);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const inspection = await prisma.inspection.update({ where: { id }, data: body });
  return NextResponse.json(inspection);
}
