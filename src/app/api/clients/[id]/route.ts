import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma"; // NO CURLY BRACES - DEFAULT IMPORT

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sites: {
          include: {
            inspections: {
              orderBy: { date: 'desc' },
              include: {
                anomalies: {
                  select: { iecClass: true }
                }
              }
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error(`Error fetching client ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Extract updateable fields
    const { name, company, email, phone, isActive } = body;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        company,
        email,
        phone,
        isActive,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error(`Error updating client ${id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clientId } = await params

    // Cascade delete in reverse dependency order to satisfy FK constraints
    await prisma.invite.deleteMany({ where: { clientId } })
    await prisma.siteMetric.deleteMany({ where: { site: { clientId } } })
    await prisma.report.deleteMany({ where: { site: { clientId } } })
    await prisma.annotation.deleteMany({ where: { inspection: { site: { clientId } } } })
    await prisma.inspection.deleteMany({ where: { site: { clientId } } })
    await prisma.site.deleteMany({ where: { clientId } })
    await prisma.client.delete({ where: { id: clientId } })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('[CLIENT DELETE ERROR]', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
