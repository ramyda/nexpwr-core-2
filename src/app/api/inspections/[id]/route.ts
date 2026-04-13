import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      client: true,
      site: true,
      annotations: { orderBy: { deltaT: "desc" } },
      reports: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-heal missing previews
  if (!inspection.thermalPreviewUrl && inspection.thermalFilePath) {
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", id);
      const filename = path.basename(inspection.thermalFilePath);
      const inputPath = path.join(uploadsDir, filename);
      const previewFilename = `preview_${Date.now()}.png`;
      const outputPath = path.join(uploadsDir, previewFilename);

      if (fs.existsSync(inputPath)) {
        await sharp(inputPath)
          .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toFile(outputPath);

        inspection = await prisma.inspection.update({
          where: { id },
          data: { thermalPreviewUrl: `/uploads/${id}/${previewFilename}` },
          include: {
            client: true,
            site: true,
            annotations: { orderBy: { deltaT: "desc" } },
            reports: { orderBy: { createdAt: "desc" } },
          }
        });
      }
    } catch (error) {
      console.error("Auto-heal preview generation failed:", error);
    }
  }

  return NextResponse.json(inspection);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const body = await req.json();
  const inspection = await prisma.inspection.update({ 
    where: { id }, 
    data: body 
  });
  return NextResponse.json(inspection);
}
