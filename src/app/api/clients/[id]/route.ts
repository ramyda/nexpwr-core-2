import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sites: {
          include: {
            inspections: {
              orderBy: { date: 'desc' },
              take: 1,
              include: {
                _count: {
                  select: { annotations: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client sites:', error);
    return NextResponse.json({ error: "Failed to fetch client details" }, { status: 500 });
  }
}
