import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET /api/invites/[token] — verify token validity
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.used || invite.expiresAt < new Date())
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 410 });
  return NextResponse.json({ email: invite.email, role: invite.role });
}

// POST /api/invites/[token] — accept invite and create account
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.used || invite.expiresAt < new Date())
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 410 });

  const { name, password } = await req.json();
  const email = invite.email || (await req.json()).email;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: invite.email || "" } });
  if (existing) return NextResponse.json({ error: "Account already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: invite.email || "", name, role: invite.role, passwordHash },
  });

  // Mark invite as used
  await prisma.invite.update({ where: { token }, data: { used: true } });

  return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
}
