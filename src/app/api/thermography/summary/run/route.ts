import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const job = await prisma.summaryJob.create({
      data: { status: "running" },
    });
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}
