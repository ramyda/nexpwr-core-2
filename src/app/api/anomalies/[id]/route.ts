import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const body = await req.json();
  // Map old keys to new keys if they come from legacy clients
  const payload = { ...body };
  if (body.deltaTC !== undefined) payload.deltaT = body.deltaTC;
  if (body.tAnomalyC !== undefined) payload.tAnomaly = body.tAnomalyC;
  if (body.tReferenceC !== undefined) payload.tReference = body.tReferenceC;
  
  delete payload.deltaTC;
  delete payload.tAnomalyC;
  delete payload.tReferenceC;

  const annotation = await prisma.annotation.update({ 
    where: { id }, 
    data: payload 
  });
  return NextResponse.json(annotation);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  await prisma.annotation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
