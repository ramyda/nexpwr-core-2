import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const siteId = searchParams.get("site_id");

  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (siteId) where.siteId = siteId;

  const inspections = await prisma.inspection.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      client: { select: { company: true } },
      site: { select: { name: true, location: true, capacityMw: true } },
      _count: { select: { annotations: true } },
    },
  });
  return NextResponse.json(inspections);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { siteId, clientId, date, ...rest } = body;

  try {
    const inspection = await prisma.inspection.create({
      data: {
        siteId,
        clientId,
        date: new Date(date),
        ...rest,
        status: "DRAFT",
      },
    });

    // Initialize File Storage Folder
    const uploadsDir = path.join(process.cwd(), "public", "uploads", inspection.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return NextResponse.json(inspection, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create inspection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
