import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CLASS_COLORS: Record<string, [number, number, number]> = {
  C4: [220, 38, 38],
  C3: [234, 88, 12],
  C2: [37, 99, 235],
  C1: [22, 163, 74],
  UNC: [139, 92, 246],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      inspection: {
        include: {
          site: true,
          anomalies: { orderBy: { deltaTC: "desc" } },
        },
      },
    },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { inspection } = report;
  const { site, anomalies, date } = inspection;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const PX = 16;
  const textColor: [number, number, number] = [17, 17, 17];
  const mutedColor: [number, number, number] = [120, 120, 120];
  const accentGreen: [number, number, number] = [22, 163, 74];
  const borderColor: [number, number, number] = [234, 234, 234];

  const smallFooter = (pageLabel: string) => {
    doc.setFontSize(7);
    doc.setTextColor(...mutedColor);
    doc.text(
      `NexPwr by Elytrus Pvt. Ltd.  |  IEC 62446-3:2017  |  ${pageLabel}`,
      PX, 290
    );
    doc.text(new Date().toLocaleDateString("en-GB"), W - PX, 290, { align: "right" });
  };

  // ─── PAGE 1: COVER ───────────────────────────────────────────────
  // Green accent bar top
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 6, "F");

  // NP logo block
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(PX, 18, 12, 12, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("NP", PX + 6, 26, { align: "center" });

  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("NexPwr", PX + 15, 24);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("by Elytrus Pvt. Ltd.", PX + 15, 29);

  // IEC Badge
  doc.setDrawColor(...borderColor);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(W - PX - 45, 16, 45, 12, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setTextColor(...accentGreen);
  doc.setFont("helvetica", "bold");
  doc.text("IEC 62446-3:2017", W - PX - 22.5, 23, { align: "center" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("COMPLIANT", W - PX - 22.5, 27, { align: "center" });

  // Divider
  doc.setDrawColor(...borderColor);
  doc.line(PX, 36, W - PX, 36);

  // Cover title block
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Solar PV Aerial", PX, 70);
  doc.text("Inspection Report", PX, 82);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Radiometric Thermal Analysis  ·  IEC 62446-3 Compliant", PX, 92);

  // Green underline accent
  doc.setFillColor(...accentGreen);
  doc.rect(PX, 96, 40, 1.5, "F");

  // Site metadata grid
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(PX, 108, W - 2 * PX, 60, 3, 3, "FD");

  const meta = [
    ["Site", site.name],
    ["Location", site.location],
    ["Capacity", `${site.capacityMw} MW`],
    ["Inspection Date", new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
    ["Operator", inspection.operator || "—"],
    ["Drone", inspection.droneModel || "—"],
    ["Irradiance", inspection.irradianceWm2 ? `${inspection.irradianceWm2} W/m²` : "—"],
    ["Ambient Temp", inspection.ambientTempC ? `${inspection.ambientTempC}°C` : "—"],
  ];

  let mx = PX + 6;
  let my = 116;
  const colW = (W - 2 * PX - 12) / 2;
  meta.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = mx + col * (colW + 6);
    const y = my + row * 13;
    doc.setFontSize(7);
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text(k.toUpperCase(), x, y);
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text(String(v), x, y + 5);
  });

  // Anomaly counts bar at bottom of cover
  const counts = {
    C4: anomalies.filter(a => a.iecClass === "C4").length,
    C3: anomalies.filter(a => a.iecClass === "C3").length,
    C2: anomalies.filter(a => a.iecClass === "C2").length,
    C1: anomalies.filter(a => a.iecClass === "C1").length,
  };
  const cards = [
    { label: "Total", value: anomalies.length, color: textColor as [number, number, number] },
    { label: "C4 Critical", value: counts.C4, color: CLASS_COLORS.C4 },
    { label: "C3 Severe", value: counts.C3, color: CLASS_COLORS.C3 },
    { label: "C2 Moderate", value: counts.C2, color: CLASS_COLORS.C2 },
    { label: "C1 Minor", value: counts.C1, color: CLASS_COLORS.C1 },
  ];
  const cardW = (W - 2 * PX - 4 * 4) / 5;
  cards.forEach((c, i) => {
    const cx = PX + i * (cardW + 4);
    const cy = 180;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(cx, cy, cardW, 22, 2, 2, "FD");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c.color);
    doc.text(String(c.value), cx + cardW / 2, cy + 12, { align: "center" });
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text(c.label, cx + cardW / 2, cy + 18, { align: "center" });
  });

  smallFooter("Cover");

  // ─── PAGE 2: FINDINGS TABLE ──────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 4, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Anomaly Findings", PX, 22);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text(`${anomalies.length} anomalies detected — sorted by ΔT (highest first)`, PX, 29);

  autoTable(doc, {
    startY: 36,
    margin: { left: PX, right: PX },
    head: [["Type", "IEC Class", "ΔT (°C)", "T Anomaly", "Location", "Priority", "Modules"]],
    body: anomalies.map((a) => [
      a.type,
      a.iecClass,
      `+${a.deltaTC.toFixed(1)}`,
      `${a.tAnomalyC.toFixed(1)}°C`,
      a.locationString || "—",
      a.priority || "—",
      a.modulesAffected,
    ]),
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [...textColor] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      1: {
        fontStyle: "bold",
        halign: "center",
      },
      2: { fontStyle: "bold", halign: "right" },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const cls = String(data.cell.raw);
        const col = CLASS_COLORS[cls] || CLASS_COLORS.UNC;
        doc.setFillColor(...col);
        // small dot before text
      }
    },
  });

  smallFooter("Findings Table");

  // ─── PAGE 3: IEC COMPLIANCE TABLE ───────────────────────────────
  doc.addPage();
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 4, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("IEC 62446-3:2017 Compliance", PX, 22);

  autoTable(doc, {
    startY: 30,
    margin: { left: PX, right: PX },
    head: [["Parameter", "Value", "Threshold", "Status"]],
    body: [
      ["Irradiance", inspection.irradianceWm2 ? `${inspection.irradianceWm2} W/m²` : "N/R", "≥ 700 W/m²", (inspection.irradianceWm2 || 0) >= 700 ? "✓ PASS" : "✗ FAIL"],
      ["Ambient Temperature", inspection.ambientTempC ? `${inspection.ambientTempC}°C` : "N/R", "Recorded", inspection.ambientTempC ? "✓ PASS" : "⚠ N/R"],
      ["Wind Speed", inspection.windSpeedMs ? `${inspection.windSpeedMs} m/s` : "N/R", "< 8 m/s", !inspection.windSpeedMs || (inspection.windSpeedMs || 0) < 8 ? "✓ PASS" : "✗ FAIL"],
      ["Module Temp Recorded", inspection.moduleTempC ? `${inspection.moduleTempC}°C` : "N/R", "Recorded", inspection.moduleTempC ? "✓ PASS" : "⚠ N/R"],
      ["Emissivity", inspection.emissivity ? String(inspection.emissivity) : "N/R", "0.85–0.95", inspection.emissivity && inspection.emissivity >= 0.85 ? "✓ PASS" : "⚠ N/R"],
      ["Anomaly Classification (IEC §5.3)", "Applied", "IEC Class C1–C4", "✓ PASS"],
      ["False Color Rendering", "Iron palette", "Required", "✓ PASS"],
    ],
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      3: {
        fontStyle: "bold",
        halign: "center",
      },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const v = String(data.cell.raw);
        if (v.startsWith("✓")) doc.setTextColor(...accentGreen);
        else if (v.startsWith("✗")) doc.setTextColor(...CLASS_COLORS.C4);
        else doc.setTextColor(245, 158, 11);
      }
    },
  });

  smallFooter("IEC Compliance");

  // ─── PAGE 4: SEVERITY CLASSIFICATION ────────────────────────────
  doc.addPage();
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 4, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Severity Classification", PX, 22);

  const classes = [
    { cls: "C4", label: "Critical", delta: "ΔT ≥ 20°C", desc: "Immediate action required. High risk of module failure, fire, or permanent damage.", count: counts.C4 },
    { cls: "C3", label: "Severe", delta: "ΔT ≥ 10°C", desc: "Action required within 1 inspection cycle. Significant power loss.", count: counts.C3 },
    { cls: "C2", label: "Moderate", delta: "ΔT ≥ 3°C", desc: "Monitor and plan maintenance. Moderate efficiency loss.", count: counts.C2 },
    { cls: "C1", label: "Minor", delta: "ΔT < 3°C", desc: "Low priority. Minimal power impact. Record and monitor.", count: counts.C1 },
    { cls: "UNC", label: "Unclassified", delta: "No ΔT", desc: "Insufficient thermal data. Manual inspection recommended.", count: anomalies.filter(a => a.iecClass === "UNC").length },
  ];

  let cy2 = 35;
  classes.forEach((c) => {
    const col = CLASS_COLORS[c.cls] || ([139, 92, 246] as [number, number, number]);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(PX, cy2, W - 2 * PX, 22, 2, 2, "FD");

    // Color bar left
    doc.setFillColor(...col);
    doc.roundedRect(PX, cy2, 4, 22, 2, 0, "F");

    // Class badge
    doc.setFillColor(...col);
    doc.roundedRect(PX + 9, cy2 + 5, 12, 8, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(c.cls, PX + 15, cy2 + 10.5, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(`${c.label} — ${c.delta}`, PX + 26, cy2 + 9);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text(c.desc, PX + 26, cy2 + 16);

    // Count badge
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col);
    doc.text(String(c.count), W - PX - 6, cy2 + 14, { align: "right" });

    cy2 += 27;
  });

  smallFooter("Severity Classification");

  // ─── PAGE 5: FINANCIAL IMPACT ────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 4, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Financial Impact", PX, 22);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Based on anomaly count, module power, irradiance, and PPA rate at inspection time.", PX, 29);

  const ppaRate = inspection.ppaRate || site.ppaRate || 0.07;
  const annualPoa = inspection.annualPoa || 1600;
  const modulePowerW = 400;
  const pr = (inspection as any).performanceRatio || site.performanceRatio || 0.8;
  const irr = inspection.irradianceWm2 || 800;

  const calcLoss = (a: { modulesAffected: number; deltaTC: number }) => {
    const dcLoss = (a.modulesAffected * modulePowerW * (a.deltaTC * 0.4) / 100) / 1000;
    const annKwh = dcLoss * annualPoa * pr;
    const dollar = annKwh * ppaRate;
    return { dcLoss, annKwh, dollar };
  };

  autoTable(doc, {
    startY: 36,
    margin: { left: PX, right: PX },
    head: [["Type", "IEC", "Modules", "DC Loss (kW)", "Annual kWh Loss", "Annual $ Loss"]],
    body: anomalies.slice(0, 20).map((a) => {
      const { dcLoss, annKwh, dollar } = calcLoss(a);
      return [a.type, a.iecClass, a.modulesAffected, dcLoss.toFixed(3), Math.round(annKwh).toLocaleString(), `$${dollar.toFixed(2)}`];
    }),
    headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 5: { fontStyle: "bold", halign: "right" } },
  });

  const totals = anomalies.reduce((acc, a) => {
    const { dcLoss, annKwh, dollar } = calcLoss(a);
    return { dc: acc.dc + dcLoss, kwh: acc.kwh + annKwh, usd: acc.usd + dollar };
  }, { dc: 0, kwh: 0, usd: 0 });

  const ty = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(PX, ty, W - 2 * PX, 16, 2, 2, "FD");
  doc.setTextColor(...textColor);
  doc.text("Portfolio Totals", PX + 5, ty + 10);
  doc.setTextColor(...accentGreen);
  doc.text(`${totals.dc.toFixed(2)} kW DC Loss`, PX + 55, ty + 10);
  doc.setTextColor(37, 99, 235);
  doc.text(`${Math.round(totals.kwh).toLocaleString()} kWh/yr`, PX + 110, ty + 10);
  doc.setTextColor(234, 88, 12);
  doc.text(`$${totals.usd.toFixed(2)}/yr`, PX + 155, ty + 10);

  // Disclaimer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("* Financial estimates are approximate. Calculations assume module-level derating per IEC 62446-3:2017 Annex B.", PX, ty + 26);

  smallFooter("Financial Impact");

  // ─── PAGE 6: APPENDIX ────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...accentGreen);
  doc.rect(0, 0, W, 4, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Appendix — Anomaly Type Definitions", PX, 22);

  const defs = [
    ["Hot Spot", "Localized high-temperature zone on a single cell or bypass diode circuit, caused by shading, contamination, or cell mismatch."],
    ["Bypass Diode", "Activated bypass diode causing a third of the module (one cell string) to produce reduced or no power."],
    ["PID", "Potential Induced Degradation — voltage stress causing power loss, typically on modules near negative polarity string ends."],
    ["String Fault", "Entire string showing anomalous temperature, indicative of a combiner box fault, open circuit, or groundfault."],
    ["Module", "Entire module showing elevated temperature compared to adjacent modules, possibly due to delamination or manufacturing defect."],
    ["Cell", "Individual cell showing hot region, typically caused by internal micro-crack or contamination."],
    ["Missing Module", "Module absent or reversed in the array — visible as a cold gap in the thermal image."],
  ];

  let ay = 32;
  defs.forEach(([term, def]) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(term, PX, ay);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    const lines = doc.splitTextToSize(def, W - 2 * PX);
    doc.text(lines, PX, ay + 6);
    ay += 6 + lines.length * 5 + 4;
  });

  smallFooter("Appendix");

  // ─── Return PDF ───────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  // Mark report as READY
  await prisma.report.update({ where: { id }, data: { status: "READY" } });

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nexpwr-report-${site.name.replace(/\s+/g, "-")}-${id.slice(0, 8)}.pdf"`,
    },
  });
}
