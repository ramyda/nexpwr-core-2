import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).clientId as string | null;
  if (!clientId) return NextResponse.json({ error: "No organization associated with this account" }, { status: 403 });

  try {
    const reports = await prisma.report.findMany({
      where: { clientId },
      include: {
        site: {
          select: { name: true }
        },
        inspection: {
          select: { date: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
