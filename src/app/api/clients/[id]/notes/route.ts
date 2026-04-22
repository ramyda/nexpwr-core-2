import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { clientNotes: true },
    });
    return NextResponse.json(client?.clientNotes || []);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { text, author } = body;

    const client = await prisma.client.findUnique({
      where: { id },
      select: { clientNotes: true },
    });

    const existingNotes = Array.isArray(client?.clientNotes) ? client.clientNotes : [];
    const newNote = {
      id: crypto.randomUUID(),
      text,
      author: author || "Admin",
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...existingNotes as object[]];

    await prisma.client.update({
      where: { id },
      data: { clientNotes: updatedNotes },
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Notes error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
