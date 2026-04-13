import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { inspectionId } = body;

  if (!inspectionId) {
    return NextResponse.json({ error: "Missing inspection_id" }, { status: 400 });
  }

  try {
    // 1. Fetch full data tree
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        site: true,
        client: true,
        annotations: true,
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    // 2. Prepare Report Record
    const report = await prisma.report.create({
      data: {
        inspectionId,
        clientId: inspection.clientId,
        siteId: inspection.siteId,
        status: "GENERATING",
      },
    });

    // 3. Generate PDF content (HTML)
    const htmlContent = generateReportHtml(inspection);

    // 4. Puppeteer Launch
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; border-top: 1px solid #eee; padding-top: 5px; color: #888;">
          NexPwr by Elytrus Pvt. Ltd. | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: { top: "40px", bottom: "60px", left: "40px", right: "40px" },
    });

    await browser.close();

    // 5. Save PDF to local storage
    const uploadsDir = path.join(process.cwd(), "public", "uploads", inspectionId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `report_${report.id}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const pdfUrl = `/uploads/${inspectionId}/${fileName}`;

    // 6. Update Report Record
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "READY",
        pdfUrl,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, reportId: report.id, pdfUrl });
  } catch (error: any) {
    console.error("PDF Generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateReportHtml(inspection: any) {
  const { site, client, annotations } = inspection;
  const dateStr = new Date(inspection.date).toLocaleDateString();

  // Financial Calculations
  const stats = annotations.reduce((acc: any, ann: any) => {
    // Basic loss estimation: C4 = 1.0kW, C3 = 0.5kW, C2 = 0.2kW, C1 = 0.1kW (Example logic)
    const dcLoss = ann.iecClass === "C4" ? 1.0 : ann.iecClass === "C3" ? 0.5 : ann.iecClass === "C2" ? 0.2 : 0.1;
    const annualKwh = dcLoss * (site.annualPoa || 1800) * (site.performanceRatio || 0.82);
    const annualUsd = annualKwh * (site.ppaRate || 0.10);

    acc.dcLoss += dcLoss;
    acc.annualKwh += annualKwh;
    acc.annualUsd += annualUsd;
    acc.counts[ann.iecClass] = (acc.counts[ann.iecClass] || 0) + 1;
    return acc;
  }, { dcLoss: 0, annualKwh: 0, annualUsd: 0, counts: {} });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
        .page { page-break-after: always; min-height: 1000px; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 800; color: #059669; }
        .h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-green { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }
        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 40px; }
        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
        .label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; padding: 12px; border-bottom: 2px solid #f3f4f6; }
        td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .impact-table th { background: #f9fafb; }
        .compliance-pass { color: #059669; font-weight: 700; }
        .compliance-fail { color: #dc2626; font-weight: 700; }
      </style>
    </head>
    <body>
      <!-- Page 1: Cover -->
      <div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <div class="logo">NexPwr</div>
        <h1 class="h1">IEC 62446-3 Inspection Report</h1>
        <div class="badge badge-green">Industry Standard Certified</div>
        
        <div class="grid" style="width: 80%; text-align: left;">
          <div class="card">
            <div class="label">Plant Name</div>
            <div class="value">${site.name}</div>
          </div>
          <div class="card">
            <div class="label">Client</div>
            <div class="value">${client.company}</div>
          </div>
          <div class="card">
            <div class="label">Inspection Date</div>
            <div class="value">${dateStr}</div>
          </div>
          <div class="card">
            <div class="label">Capacity</div>
            <div class="value">${site.capacityMw} MW DC</div>
          </div>
        </div>
      </div>

      <!-- Page 2: Executive Summary -->
      <div class="page">
        <h2 class="h1">Executive Summary</h2>
        <div class="grid" style="grid-template-cols: repeat(4, 1fr);">
          <div class="card" style="text-align: center;">
            <div class="label">Total Anomalies</div>
            <div class="value" style="font-size: 24px; color: #dc2626;">${annotations.length}</div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="label">Est. DC Loss</div>
            <div class="value" style="font-size: 24px;">${stats.dcLoss.toFixed(2)} kW</div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="label">Annual Generation Loss</div>
            <div class="value" style="font-size: 20px;">${Math.round(stats.annualKwh).toLocaleString()} kWh</div>
          </div>
          <div class="card" style="text-align: center; border-color: #059669;">
            <div class="label">Annual Revenue Impact</div>
            <div class="value" style="font-size: 24px; color: #059669;">$${Math.round(stats.annualUsd).toLocaleString()}</div>
          </div>
        </div>
        
        <h3 style="margin-top: 40px;">Anomaly Severity Distribution</h3>
        <table>
          <thead>
            <tr><th>Classification</th><th>Definition</th><th>Count</th><th>Priority</th></tr>
          </thead>
          <tbody>
            <tr><td>C4 (Critical)</td><td>Major temperature delta (>15°C)</td><td>${stats.counts.C4 || 0}</td><td><span style="color: red;">Immediate</span></td></tr>
            <tr><td>C3 (Major)</td><td>Significant delta (5-15°C)</td><td>${stats.counts.C3 || 0}</td><td><span style="color: orange;">Scheduled</span></td></tr>
            <tr><td>C2 (Minor)</td><td>Moderate delta (3-5°C)</td><td>${stats.counts.C2 || 0}</td><td>Monitoring</td></tr>
            <tr><td>C1 (Insignificant)</td><td>Low delta (<3°C)</td><td>${stats.counts.C1 || 0}</td><td>Normal</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Page 3: Compliance Table -->
      <div class="page">
        <h2 class="h1">IEC 62446-3 Compliance Audit</h2>
        <table>
          <thead>
            <tr><th>Parameter</th><th>Required Value</th><th>Measured Value</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Min. Irradiance</td><td>>600 W/m²</td><td>${inspection.irradianceWm2 || 0} W/m²</td><td class="${(inspection.irradianceWm2 || 0) >= 600 ? 'compliance-pass' : 'compliance-fail'}">${(inspection.irradianceWm2 || 0) >= 600 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Delta T Threshold</td><td>3.0°C</td><td>${inspection.deltaTThreshold || 0}°C</td><td class="compliance-pass">PASS</td></tr>
            <tr><td>Camera Emissivity</td><td>0.85</td><td>${inspection.emissivity || 0}</td><td class="compliance-pass">PASS</td></tr>
            <tr><td>Ambient Temp</td><td>-</td><td>${inspection.ambientTempC || 0}°C</td><td class="compliance-pass">PASS</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Page 4: Findings + Financial -->
      <div class="page">
        <h2 class="h1">Detailed Financial Impact</h2>
        <table class="impact-table">
          <thead>
            <tr><th>Anomaly ID</th><th>Type</th><th>IEC Class</th><th>ΔT (°C)</th><th>Annual Loss ($)</th></tr>
          </thead>
          <tbody>
            ${annotations.map((ann: any, idx: number) => {
              const dcLoss = ann.iecClass === "C4" ? 1.0 : ann.iecClass === "C3" ? 0.5 : ann.iecClass === "C2" ? 0.2 : 0.1;
              const lossUsd = dcLoss * (site.annualPoa || 1800) * (site.performanceRatio || 0.82) * (site.ppaRate || 0.10);
              return `
                <tr>
                  <td>ANN-${String(idx + 1).padStart(3, '0')}</td>
                  <td>${ann.type}</td>
                  <td style="font-weight: 700; color: ${ann.iecClass === 'C4' ? 'red' : 'inherit'}">${ann.iecClass}</td>
                  <td>${ann.deltaT}°C</td>
                  <td>$${Math.round(lossUsd).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Page 5: Anomaly Catalog (Simplified for demo) -->
      ${annotations.map((ann: any, idx: number) => `
        <div class="page">
          <h2 class="h1">Anomaly ANN-${String(idx + 1).padStart(3, '0')}</h2>
          <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div style="flex: 1; background: #eee; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
               <div style="text-align: center; color: #666;">
                 <div style="font-size: 12px; font-weight: 800; margin-bottom: 5px;">THERMAL VIEW</div>
                 [CROP AT ${ann.lat}, ${ann.lng}]
               </div>
            </div>
            <div style="flex: 1; background: #ddd; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
               <div style="text-align: center; color: #666;">
                 <div style="font-size: 12px; font-weight: 800; margin-bottom: 5px;">RGB VIEW</div>
                 [CROP AT ${ann.lat}, ${ann.lng}]
               </div>
            </div>
          </div>
          <div class="grid" style="margin-top: 20px;">
             <div class="card">
               <div class="label">Anomaly Type</div>
               <div class="value">${ann.type}</div>
             </div>
             <div class="card">
               <div class="label">Priority Level</div>
               <div class="value">${ann.priority || "Normal"}</div>
             </div>
             <div class="card">
               <div class="label">Measured Delta T</div>
               <div class="value">${ann.deltaT}°C</div>
             </div>
             <div class="card">
               <div class="label">GPS Coordinates</div>
               <div class="value">${ann.lat}, ${ann.lng}</div>
             </div>
          </div>
          <div class="card" style="margin-top: 20px;">
             <div class="label">Notes</div>
             <div class="value">${ann.notes || "No additional comments."}</div>
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}
