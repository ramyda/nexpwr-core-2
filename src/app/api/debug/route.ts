import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, passwordHash: true },
    });
    return NextResponse.json({
      status: "ok",
      dbConnected: true,
      userCount,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        hasHash: !!u.passwordHash,
        hashPrefix: u.passwordHash?.slice(0, 7),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      dbConnected: false,
      message: error.message,
    }, { status: 500 });
  }
}
