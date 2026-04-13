import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        inspection: {
          include: { site: true, client: true }
        }
      }
    });

    if (!report || !report.inspection) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Determine file path
    // The Puppeteer generator saves to /public/uploads/[inspectionId]/report_[reportId].pdf
    const inspectionId = report.inspectionId;
    const fileName = `report_${id}.pdf`;
    const filePath = path.join(process.cwd(), "public", "uploads", inspectionId, fileName);

    if (!fs.existsSync(filePath)) {
      // Fallback: If file doesn't exist, we might need to trigger generation or return error
      return NextResponse.json({ 
        error: "PDF file not found on server. Please regenerate the report.",
        filePath: `/uploads/${inspectionId}/${fileName}` 
      }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const siteName = report.inspection.site?.name.replace(/\s+/g, "-") || "solar";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nexpwr-report-${siteName}-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Serve failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
