import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// GET /api/invites — list all invites (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const invites = await prisma.invite.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(invites);
}

// POST /api/invites — create new invite link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await req.json();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.invite.create({
    data: { token, email, role: role || "CLIENT", expiresAt },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/invite/${token}`;
  return NextResponse.json({ invite, url: inviteUrl }, { status: 201 });
}
