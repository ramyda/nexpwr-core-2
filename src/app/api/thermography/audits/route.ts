import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const audits = await prisma.thermographyAudit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            clientId: true,
            client: { select: { id: true, name: true, company: true } },
          },
        },
      },
    });

    return NextResponse.json(audits);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, siteId, groupId } = body;

    const audit = await prisma.thermographyAudit.create({
      data: {
        name,
        siteId: siteId || null,
        groupId: groupId || null,
        status: "not_started",
      },
    });

    return NextResponse.json(audit);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 });
  }
}
