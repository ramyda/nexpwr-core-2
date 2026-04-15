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
    const sites = await prisma.site.findMany({
      where: { clientId },
      include: {
        inspections: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true }
        }
      },
      orderBy: { name: "asc" },
    });

    const formattedSites = sites.map(site => ({
      id: site.id,
      name: site.name,
      location: site.location,
      cod: site.commissioningDate ? new Date(site.commissioningDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
      lastInspection: site.inspections[0]?.date ? new Date(site.inspections[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None",
      initial: site.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      color: "bg-zinc-800" // Default for live data
    }));

    return NextResponse.json(formattedSites);
  } catch (error: any) {
    console.error("Failed to fetch sites:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
