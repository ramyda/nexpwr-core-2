import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        client: true,
        site: true,
        inspection: { include: { client: true, site: true } },
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // 1. Update DB Status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        publishedToClient: true,
        publishedAt: new Date(),
      },
    });

    // 2. Update Inspection Status
    await prisma.inspection.update({
      where: { id: report.inspectionId },
      data: { status: "PUBLISHED" },
    });

    // 3. Send Email via Resend
    if (resend && report.client?.email) {
      try {
        await resend.emails.send({
          from: "NexPwr Reports <reports@nexpwr.ai>",
          to: report.client.email,
          subject: `Solar Inspection Report Ready: ${report.site?.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #059669;">NexPwr Energy Intelligence</h2>
              <p>Hello <strong>${report.client.name || 'Team'}</strong>,</p>
              <p>The solar inspection report for <strong>${report.site?.name}</strong> (Inspection Date: ${new Date(report.inspection!.date).toLocaleDateString()}) is now available for review.</p>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/client/reports" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Reports</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">You can download the full PDF, CSV, and KML exports directly from your dashboard.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px;">This is an automated message from NexPwr. Please do not reply directly to this email.</p>
            </div>
          `,
        });
        console.log(`Email sent to ${report.client.email}`);
      } catch (emailError) {
        console.error("Resend Email failed:", emailError);
        // We don't throw here to ensure the DB update persists even if email fails
      }
    } else {
      console.warn("Resend API Key missing or client email not found. Skipping email.");
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error: any) {
    console.error("Publishing failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
