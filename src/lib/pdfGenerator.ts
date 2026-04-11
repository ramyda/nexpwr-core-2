import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Anomaly, InspectionMetadata, PlantMetadata } from "./store";
import {
  LOSS_FACTORS, POWER_LOSS_DISCLAIMER, PDF_PAGE_FOOTER,
  IEC_THERMAL_EQUILIBRIUM_STATEMENT, getSeverityFromDelta,
} from "./constants";
import {
  calcAnomaly, validateBeforeReport, formatDate,
  getDCLossSTC, getAnnualKwhLoss, getAnnualDollarLoss, getDCLossPct,
  getDCLossInstant, getPOperating,
} from "./utils";

type RGB = [number, number, number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_GREEN: RGB = [16, 185, 129];
const DARK_BG: RGB    = [18, 18, 22];
const ROW_DARK: RGB   = [39, 39, 42];

function pageWidth(doc: jsPDF)  { return doc.internal.pageSize.width; }
function pageHeight(doc: jsPDF) { return doc.internal.pageSize.height; }

function addPageFooter(doc: jsPDF, pageNum: number): void {
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  doc.setFillColor(24, 24, 27);
  doc.rect(0, h - 30, w, 30, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  const lines = doc.splitTextToSize(PDF_PAGE_FOOTER, w - 80);
  doc.text(lines, w / 2, h - 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${pageNum}`, w - 35, h - 9, { align: "right" });
  doc.text("NexPwr Aerial Intelligence", 35, h - 9);
  doc.setTextColor(0, 0, 0);
}

function addPageHeader(doc: jsPDF, title: string): void {
  const w = pageWidth(doc);
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, w, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 38, 22);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

function windWarningText(windMs: number): string {
  return `WARNING — Wind speed at inspection was ${windMs} m/s. IEC 62446-3 recommends below 4 m/s. Convective cooling at elevated wind speeds may suppress hotspot temperatures causing anomaly severity to be understated.`;
}

function printWindWarning(doc: jsPDF, windMs: number, y: number, marginL: number): number {
  const w = pageWidth(doc);
  const box = doc.splitTextToSize(windWarningText(windMs), w - marginL * 2 - 20);
  const boxH = box.length * 10 + 16;
  doc.setFillColor(80, 50, 0);
  doc.roundedRect(marginL, y, w - marginL * 2, boxH, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 195, 50);
  doc.text("⚠ WIND SPEED WARNING", marginL + 10, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(box, marginL + 10, y + 22);
  doc.setTextColor(0, 0, 0);
  return y + boxH + 8;
}

// Row aggregation (Section 7)
interface FindingsRow {
  anomalyType: string;
  count: number;
  modules: number;
  dcInstantKw: number;
  dcStcKw: number;
  dcPct: number;
  annualKwh: number;
  annualDollar: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION AND PRE-FLIGHT CHECK
// ─────────────────────────────────────────────────────────────────────────────
export interface PreflightResult {
  ok: boolean;
  blockingErrors: string[];
  warnings: string[];
}

export function preflightCheck(
  anomalies: Anomaly[],
  plantMeta: PlantMetadata,
  inspMeta: InspectionMetadata
): PreflightResult {
  const plantCapacityKwp = plantMeta.capacityMw * 1000;

  // Calculate totalDcPct first
  let totalDcStcKw = 0;
  anomalies.forEach(a => {
    totalDcStcKw += getDCLossSTC(
      a.modulesAffected || 1,
      plantMeta.modulePowerW,
      LOSS_FACTORS[a.type] ?? 0
    );
  });
  const totalDcPct = getDCLossPct(totalDcStcKw, plantCapacityKwp);

  const errors = validateBeforeReport({
    irradianceWm2: inspMeta.irradianceWm2,
    moduleTempC: inspMeta.moduleTempC,
    tempCoeffPmax: plantMeta.tempCoeffPmax,
    plantCapacityKwp,
    ppaRate: inspMeta.ppaRate,
    annualPoaIrradiance: inspMeta.annualPoaIrradiance,
    performanceRatio: inspMeta.performanceRatio,
    anomalyCount: anomalies.length,
    minModulesAffected: Math.min(...anomalies.map(a => a.modulesAffected || 0), 1),
    totalDcPct,
  });

  const blockingErrors = errors.filter(e => e.blocking).map(e => e.message);
  const warnings: string[] = [];

  if (inspMeta.windSpeedMs > 4) warnings.push(windWarningText(inspMeta.windSpeedMs));
  if (totalDcPct > 30 && totalDcPct <= 100) {
    warnings.push("Total estimated loss exceeds 30% of plant capacity. Verify all anomaly module counts before issuing this report.");
  }

  return { ok: blockingErrors.length === 0, blockingErrors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function generateRaptorPDF(
  anomalies: Anomaly[],
  plantMeta: PlantMetadata,
  inspMeta: InspectionMetadata
): Promise<void> {
  const preflight = preflightCheck(anomalies, plantMeta, inspMeta);
  if (!preflight.ok) {
    throw new Error(preflight.blockingErrors.join("\n\n"));
  }

  // eslint-disable-next-line new-cap
  const doc = new jsPDF("p", "pt", "a4");
  const ML = 38; // margin left
  const MR = 38; // margin right
  const pw = pageWidth(doc);
  let pg = 1;

  const plantCapacityKwp = plantMeta.capacityMw * 1000;
  const windHigh = inspMeta.windSpeedMs > 4;
  const irradianceValid = inspMeta.irradianceWm2 >= 600;

  // ─── Pre-compute findings table (Section 7) ───────────────────────────────
  const rowMap: Record<string, FindingsRow> = {};
  anomalies.forEach(a => {
    const r = calcAnomaly({
      anomalyType: a.type,
      modulesAffected: a.modulesAffected || 1,
      modulePowerWp: plantMeta.modulePowerW,
      irradianceWm2: inspMeta.irradianceWm2,
      tempCoeffPmax: plantMeta.tempCoeffPmax,
      moduleTempC: inspMeta.moduleTempC,
      annualPoaIrradiance: inspMeta.annualPoaIrradiance,
      performanceRatio: inspMeta.performanceRatio,
      ppaRate: inspMeta.ppaRate,
      plantCapacityKwp,
    });
    if (!rowMap[a.type]) {
      rowMap[a.type] = { anomalyType: a.type, count: 0, modules: 0, dcInstantKw: 0, dcStcKw: 0, dcPct: 0, annualKwh: 0, annualDollar: 0 };
    }
    rowMap[a.type].count++;
    rowMap[a.type].modules     += (a.modulesAffected || 1);
    rowMap[a.type].dcInstantKw += r.dcLossInstantKw;
    rowMap[a.type].dcStcKw     += r.dcLossStcKw;
    rowMap[a.type].annualKwh   += r.annualKwhLoss;
    rowMap[a.type].annualDollar += r.annualDollarLoss;
  });

  // Compute dcPct per row from row totals
  Object.values(rowMap).forEach(row => {
    row.dcPct = getDCLossPct(row.dcStcKw, plantCapacityKwp);
  });

  const rows = Object.values(rowMap);

  // Section 8 — Executive summary stats
  const totalDcInstant     = rows.reduce((s, r) => s + r.dcInstantKw, 0);
  const totalDcStc         = rows.reduce((s, r) => s + r.dcStcKw, 0);
  const totalDcPct         = getDCLossPct(totalDcStc, plantCapacityKwp);
  const totalAnnualKwh     = rows.reduce((s, r) => s + r.annualKwh, 0);
  const totalAnnualDollar  = rows.reduce((s, r) => s + r.annualDollar, 0);
  const totalModules       = anomalies.reduce((s, a) => s + (a.modulesAffected || 1), 0);

  const class4Count = anomalies.filter(a => (a.tempDeltaC ?? -1) >= 20).length;
  const class3Count = anomalies.filter(a => (a.tempDeltaC ?? -1) >= 10 && (a.tempDeltaC ?? -1) < 20).length;
  const class2Count = anomalies.filter(a => (a.tempDeltaC ?? -1) >= 3  && (a.tempDeltaC ?? -1) < 10).length;
  const class1Count = anomalies.filter(a => (a.tempDeltaC ?? -1) >= 0  && (a.tempDeltaC ?? -1) < 3).length;
  const unclassifiedCount = anomalies.filter(a => a.tempDeltaC == null).length;

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pw, pageHeight(doc), "F");
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, 6, pageHeight(doc), "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(plantMeta.name || "UNNAMED SOLAR PLANT", ML + 12, 170);

  doc.setFontSize(14);
  doc.setTextColor(...BRAND_GREEN);
  doc.text("Aerial Thermographic PV Inspection Report", ML + 12, 196);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(190, 190, 190);
  const coverInfo = [
    `Inspection Date: ${formatDate(inspMeta.date)}`,
    `Operator: ${inspMeta.operator || "Not stated"}`,
    `Drone: ${inspMeta.droneModel || "N/A"}  |  Camera/Sensor: ${inspMeta.cameraModel || "N/A"}`,
    `Plant Capacity: ${plantMeta.capacityMw} MW DC (${plantCapacityKwp.toLocaleString()} kWp)`,
    `Location: ${plantMeta.locationText || "N/A"}${plantMeta.lat ? `  (${plantMeta.lat.toFixed(4)}, ${plantMeta.lng?.toFixed(4)})` : ""}`,
    `Module: ${plantMeta.moduleBrand} ${plantMeta.moduleModel} — ${plantMeta.modulePowerW} Wp`,
    `Layout Asset: ${plantMeta.layoutFileName || "Not Provided"} (${plantMeta.layoutType || "None"})`,
    `Irradiance at inspection: ${inspMeta.irradianceWm2} W/m² — ${irradianceValid ? "VALID" : "INVALID"} per IEC 62446-3`,
  ];
  coverInfo.forEach((line, i) => doc.text(line, ML + 12, 320 + i * 22));

  if (windHigh) {
    const warnBox = doc.splitTextToSize(windWarningText(inspMeta.windSpeedMs), pw - ML * 2 - 30);
    const bH = warnBox.length * 11 + 22;
    doc.setFillColor(80, 50, 0);
    doc.roundedRect(ML + 12, 480, pw - ML * 2 - 24, bH, 4, 4, "F");
    doc.setTextColor(255, 195, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("⚠ WIND SPEED WARNING", ML + 22, 494);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(warnBox, ML + 22, 506);
  }

  // IEC Methodology statement at bottom of cover
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  const footerLines = doc.splitTextToSize(PDF_PAGE_FOOTER, pw - ML * 2);
  doc.text(footerLines, ML + 12, pageHeight(doc) - 65);

  addPageFooter(doc, pg);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pg++;
  addPageHeader(doc, "EXECUTIVE SUMMARY");

  let y = 55;

  // Wind warning on exec summary too (Section 4 Check 2)
  if (windHigh) {
    y = printWindWarning(doc, inspMeta.windSpeedMs, y, ML);
  }

  // Disclaimer (Section 13)
  const disclaimerLines = doc.splitTextToSize(POWER_LOSS_DISCLAIMER, pw - ML * 2);
  const disclaimerH = disclaimerLines.length * 9 + 18;
  doc.setFillColor(30, 40, 30);
  doc.roundedRect(ML, y, pw - ML * 2, disclaimerH, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(180, 220, 180);
  doc.text(disclaimerLines, ML + 10, y + 12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += disclaimerH + 12;

  // Summary stats table (Section 8)
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Anomalies", anomalies.length.toString()],
      ["Class 4 — Critical (ΔT ≥ 20°C)", class4Count.toString()],
      ["Class 3 — Moderate (ΔT 10–20°C)", class3Count.toString()],
      ["Class 2 — Minor (ΔT 3–10°C)", class2Count.toString()],
      ["Class 1 — Not Significant (ΔT 0–3°C)", class1Count.toString()],
      ["Unclassified (ΔT not recorded)", unclassifiedCount.toString()],
      ["Total Modules Affected", totalModules.toLocaleString()],
      ["DC Loss at Inspection (instantaneous)", `${totalDcInstant.toFixed(3)} kW`],
      ["DC Loss — STC basis (for annual projection)", `${totalDcStc.toFixed(3)} kW`],
      ["DC Loss (% of plant capacity)", `${totalDcPct.toFixed(3)}%`],
      ["Annual Energy Loss Projection", `${Math.round(totalAnnualKwh).toLocaleString()} kWh/yr`],
      ["Annual Financial Loss Estimate", `$${totalAnnualDollar.toFixed(2)}`],
    ],
    theme: "grid",
    headStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255] },
    margin: { left: ML, right: MR },
    didParseCell: (d) => {
      if (d.section !== "body") return;
      if (d.column.index !== 1) return;
      const idx = d.row.index;
      if (idx === 1) d.cell.styles.textColor = [239, 68, 68];
      if (idx === 2) d.cell.styles.textColor = [251, 191, 36];
      if (idx === 3) d.cell.styles.textColor = [16, 185, 129];
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // IEC Compliance box
  const compChecks = [
    { label: "Irradiance",     val: `${inspMeta.irradianceWm2} W/m²`, ok: irradianceValid },
    { label: "Module Temp.",   val: `${inspMeta.moduleTempC}°C`,       ok: inspMeta.moduleTempC > 0 },
    { label: "Wind Speed",     val: `${inspMeta.windSpeedMs} m/s`,     ok: inspMeta.windSpeedMs <= 4 },
    { label: "Emissivity",     val: inspMeta.cameraEmissivity.toFixed(2), ok: inspMeta.cameraEmissivity > 0 },
    { label: "ΔT Threshold",   val: `${inspMeta.minTempDeltaThreshold}°C`, ok: inspMeta.minTempDeltaThreshold > 0 },
    { label: "Annual POA",     val: `${inspMeta.annualPoaIrradiance} kWh/m²/yr`, ok: inspMeta.annualPoaIrradiance >= 800 },
    { label: "Perf. Ratio",    val: inspMeta.performanceRatio.toString(),  ok: inspMeta.performanceRatio > 0 },
  ];
  const allOk = compChecks.every(c => c.ok);
  const compBoxH = compChecks.length * 17 + 30;
  const boxFill: RGB = allOk ? [14, 60, 38] : [60, 14, 14];
  const boxBorder: RGB = allOk ? [16, 185, 129] : [200, 30, 30];
  doc.setFillColor(...boxFill);
  doc.roundedRect(ML, y, pw - ML * 2, compBoxH, 4, 4, "F");
  doc.setDrawColor(...boxBorder);
  doc.roundedRect(ML, y, pw - ML * 2, compBoxH, 4, 4, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("IEC 62446-3:2017 Inspection Conditions Compliance", ML + 12, y + 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  compChecks.forEach((c, i) => {
    const ry = y + 26 + i * 17;
    doc.setTextColor(200, 220, 210);
    doc.text(c.label, ML + 12, ry);
    doc.text(c.val, ML + 130, ry);
    doc.setTextColor(...(c.ok ? [16, 185, 129] as RGB : [239, 68, 68] as RGB));
    doc.text(c.ok ? "✓ Pass" : "✗ FAIL", ML + 260, ry);
    doc.setTextColor(200, 220, 210);
  });
  doc.setTextColor(0, 0, 0);
  addPageFooter(doc, pg);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3 — INSPECTION CONDITIONS & SITE SPECIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pg++;
  addPageHeader(doc, "INSPECTION CONDITIONS & SITE SPECIFICATIONS");
  y = 55;

  // IEC mandatory statement (Section 4 Check 3)
  const eqLines = doc.splitTextToSize(IEC_THERMAL_EQUILIBRIUM_STATEMENT, pw - ML * 2 - 20);
  const eqH = eqLines.length * 11 + 18;
  doc.setFillColor(30, 30, 50);
  doc.roundedRect(ML, y, pw - ML * 2, eqH, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 180, 255);
  doc.text("IEC 62446-3 MANDATORY REQUIREMENT:", ML + 10, y + 12);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text(eqLines, ML + 10, y + 22);
  doc.setTextColor(0, 0, 0);
  y += eqH + 10;

  if (windHigh) y = printWindWarning(doc, inspMeta.windSpeedMs, y, ML);

  autoTable(doc, {
    startY: y,
    head: [["Specification", "Value"]],
    body: [
      ["Plant Name", plantMeta.name || "N/A"],
      ["Location", `${plantMeta.locationText || "N/A"}${plantMeta.lat ? ` (${plantMeta.lat.toFixed(5)}, ${plantMeta.lng?.toFixed(5)})` : ""}`],
      ["Plant Capacity", `${plantMeta.capacityMw} MW DC = ${plantCapacityKwp.toLocaleString()} kWp`],
      ["Total Modules", plantMeta.modulesCount.toLocaleString()],
      ["Module", `${plantMeta.moduleBrand} ${plantMeta.moduleModel}`],
      ["Module STC Power", `${plantMeta.modulePowerW} Wp`],
      ["Module Technology", plantMeta.moduleTechnology || "N/A"],
      ["Temp. Coefficient Pmax", `${plantMeta.tempCoeffPmax} %/°C`],
      ["NOCT", `${plantMeta.noct}°C`],
      ["Modules Per String", plantMeta.modulesPerString.toString()],
      ["Inverter", `${plantMeta.inverterBrand} ${plantMeta.inverterModel} (${plantMeta.inverterPowerKw} kW)`],
      ["Mount Type", plantMeta.mountType.toUpperCase()],
      ["─ Inspection Parameters ─", ""],
      ["Inspection Date", formatDate(inspMeta.date)],
      ["Operator", inspMeta.operator || "N/A"],
      ["Drone / Platform", inspMeta.droneModel || "N/A"],
      ["Camera / Thermal Sensor", inspMeta.cameraModel || "N/A"],
      ["Ambient Temperature", `${inspMeta.weatherTempC}°C`],
      ["Humidity", `${inspMeta.weatherHumidity}%`],
      ["Wind Speed", `${inspMeta.windSpeedMs} m/s${windHigh ? " ⚠ EXCEEDS IEC 62446-3 LIMIT" : " ✓"}`],
      ["Cloud Cover", `${inspMeta.weatherCloudCover}%`],
      ["Irradiance at Inspection (IEC 62446-3 §5.2)", `${inspMeta.irradianceWm2} W/m² — ${irradianceValid ? "VALID ✓" : "INVALID ✗"}`],
      ["Module Backsheet Temperature", `${inspMeta.moduleTempC}°C`],
      ["Camera Emissivity Setting (IEC 62446-3 §5.3)", inspMeta.cameraEmissivity.toFixed(2)],
      ["Minimum ΔT Threshold (IEC 62446-3 Table 1)", `${inspMeta.minTempDeltaThreshold}°C`],
      ["Annual POA Irradiance (IEC 61724-1)", `${inspMeta.annualPoaIrradiance} kWh/m²/year`],
      ["Performance Ratio (IEC 61724-1)", inspMeta.performanceRatio.toFixed(2)],
      ["PPA Rate", `$${inspMeta.ppaRate}/kWh`],
    ],
    theme: "grid",
    headStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255] },
    margin: { left: ML, right: MR },
    columnStyles: { 0: { cellWidth: 220, fontStyle: "bold" } },
    didParseCell: (d) => {
      if (d.section === "body" && d.row.index === 12) {
        d.cell.styles.fillColor = [39, 39, 42];
        d.cell.styles.textColor = [16, 185, 129];
        d.cell.styles.fontStyle = "bold";
      }
    },
  });

  addPageFooter(doc, pg);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 4 — FINDINGS TABLE (Section 7)
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pg++;
  addPageHeader(doc, "DETAILED FINDINGS TABLE — FINANCIAL IMPACT ANALYSIS");
  y = 50;

  if (windHigh) y = printWindWarning(doc, inspMeta.windSpeedMs, y, ML);

  // Disclaimer header (Section 13)
  const discLines = doc.splitTextToSize(
    "DISCLAIMER: " + POWER_LOSS_DISCLAIMER,
    pw - ML * 2 - 16
  );
  const discH = discLines.length * 8 + 16;
  doc.setFillColor(30, 40, 30);
  doc.roundedRect(ML, y, pw - ML * 2, discH, 3, 3, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(160, 200, 160);
  doc.text(discLines, ML + 8, y + 10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += discH + 8;

  // Findings table
  const findingsBody = rows.map(r => [
    r.anomalyType,
    r.count.toString(),
    r.modules.toString(),
    r.dcInstantKw.toFixed(3),
    r.dcStcKw.toFixed(3),
    r.dcPct.toFixed(3) + "%",
    Math.round(r.annualKwh).toLocaleString(),
    "$" + r.annualDollar.toFixed(2),
  ]);

  const totalRow = [
    "TOTAL",
    anomalies.length.toString(),
    totalModules.toLocaleString(),
    totalDcInstant.toFixed(3),
    totalDcStc.toFixed(3),
    totalDcPct.toFixed(3) + "%",
    Math.round(totalAnnualKwh).toLocaleString(),
    "$" + totalAnnualDollar.toFixed(2),
  ];

  if (totalDcPct > 30) {
    const warnStr = "WARNING: Total estimated loss exceeds 30% of plant capacity. Verify all anomaly module counts before issuing this report.";
    const wl = doc.splitTextToSize(warnStr, pw - ML * 2 - 16);
    const wh = wl.length * 9 + 14;
    doc.setFillColor(80, 50, 0);
    doc.roundedRect(ML, y, pw - ML * 2, wh, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 195, 50);
    doc.text(wl, ML + 8, y + 10);
    doc.setTextColor(0, 0, 0);
    y += wh + 8;
  }

  autoTable(doc, {
    startY: y,
    head: [["Anomaly Type", "Count", "Modules", "DC Instant (kW)", "DC STC (kW)", "DC Loss %", "Annual kWh", "Annual $"]],
    body: findingsBody,
    foot: [totalRow],
    theme: "striped",
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontSize: 7.5 },
    footStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: ML, right: MR },
  });

  // ── Footnotes ①–⑧ (Section 10) with actual values substituted ─────────
  const fn_y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);

  const footnotes = [
    `① Instantaneous DC Loss (kW) = Modules Affected × Module Operating Power (W) × Loss Factor ÷ 1000. Module operating power corrected for measured irradiance (${inspMeta.irradianceWm2} W/m²) and module backsheet temperature (${inspMeta.moduleTempC}°C) per IEC 60891 simplified single-coefficient procedure.`,
    `② Annual DC Loss basis (kW) = Modules Affected × Module STC Power (${plantMeta.modulePowerW} Wp) × Loss Factor ÷ 1000. STC power used for annual projection; instantaneous temperature effects are embedded in Performance Ratio.`,
    `③ Annual Energy Loss (kWh/year) = Annual DC Loss (kW) × Annual POA Irradiance (${inspMeta.annualPoaIrradiance} kWh/m²/year) × Performance Ratio (${inspMeta.performanceRatio}). Method per IEC 61724-1. Annual POA irradiance source: operator provided.`,
    `④ Annual Financial Loss ($) = Annual Energy Loss (kWh) × PPA Rate ($${inspMeta.ppaRate}/kWh).`,
    `⑤ DC Loss (%) = Annual DC Loss (kW) ÷ Plant STC Capacity (${plantCapacityKwp.toLocaleString()} kWp) × 100.`,
    `⑥ Loss factors are engineering estimates derived from industry practice. They are not published by IEC 62446-3, IEC 61724-1, or any other IEC standard. Definitive power loss quantification requires I-V curve tracing per IEC 60891.`,
    `⑦ Anomaly severity classified per IEC 62446-3 Table 1 using measured ΔT (anomalous component temperature minus reference cell under identical conditions).`,
    `⑧ Inspection irradiance: ${inspMeta.irradianceWm2} W/m² — ${irradianceValid ? "VALID per IEC 62446-3 600 W/m² minimum" : "INVALID per IEC 62446-3 600 W/m² minimum"}.`,
  ];

  let fnY = fn_y;
  footnotes.forEach(fn => {
    const fnLines = doc.splitTextToSize(fn, pw - ML * 2);
    if (fnY + fnLines.length * 8 > pageHeight(doc) - 45) {
      doc.addPage(); pg++;
      addPageHeader(doc, "FINDINGS TABLE — FOOTNOTES (continued)");
      fnY = 55;
    }
    doc.text(fnLines, ML, fnY);
    fnY += fnLines.length * 8 + 4;
  });

  doc.setTextColor(0, 0, 0);
  addPageFooter(doc, pg);

  // ════════════════════════════════════════════════════════════════════════════
  // ANOMALY LOCATION MAP
  // ════════════════════════════════════════════════════════════════════════════
  const mapAnomalies = anomalies.filter(a => a.lat !== undefined && a.lng !== undefined);
  if (mapAnomalies.length > 0) {
     doc.addPage(); pg++;
     addPageHeader(doc, "ANOMALY LOCATION MAP");
     
     const centerLat = mapAnomalies.reduce((s, a) => s + (a.lat || 0), 0) / mapAnomalies.length;
     const centerLng = mapAnomalies.reduce((s, a) => s + (a.lng || 0), 0) / mapAnomalies.length;
     
     const getIconColor = (severity: string) => {
        if (severity === "critical") return "red";
        if (severity === "moderate") return "orange";
        if (severity === "minor") return "blue";
        if (severity === "not_significant") return "green";
        return "grey";
     };

     const markers = mapAnomalies.map(a => `${a.lat},${a.lng},${getIconColor(a.severity)}`).join("|");
     const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=19&size=800x400&markers=${markers}`;

     try {
       const resp = await fetch(mapUrl);
       const blob = await resp.blob();
       const b64 = await new Promise<string>((res) => {
         const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob);
       });
       doc.addImage(b64, "PNG", ML, 50, pw - ML * 2, 230);
     } catch (e) {
       doc.setFont("helvetica", "italic");
       doc.setTextColor(150, 150, 150);
       doc.text("Map generation failed or network offline.", pw/2, 100, { align: "center" });
       doc.setTextColor(0, 0, 0);
     }

     autoTable(doc, {
       startY: 300,
       head: [["ID", "Type", "Class", "ΔT", "GPS", "Location"]],
       body: mapAnomalies.map(a => [
         a.id.slice(0,8),
         a.type,
         a.severity.toUpperCase(),
         a.tempDeltaC != null ? `${a.tempDeltaC}°C` : "N/A",
         `${a.lat?.toFixed(6)}, ${a.lng?.toFixed(6)}`,
         a.panelLocation || "—"
       ]),
       theme: "grid",
       headStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255], fontSize: 8 },
       bodyStyles: { fontSize: 8 },
     });
     
     addPageFooter(doc, pg);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // IMAGE EVIDENCE CATALOG
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage(); pg++;
  addPageHeader(doc, "ANOMALY LOCATION CATALOG — IMAGE EVIDENCE");

  if (windHigh) {
    y = printWindWarning(doc, inspMeta.windSpeedMs, 52, ML);
  } else {
    y = 52;
  }

  autoTable(doc, {
    startY: y,
    head: [["IR", "RGB", "Anomaly Type", "Location", "IEC Class", "ΔT (°C)", "Modules", "Notes"]],
    body: anomalies.map(a => {
      const sv = getSeverityFromDelta(a.tempDeltaC);
      const svLabel =
        sv === "critical"       ? "Class 4 — Critical" :
        sv === "moderate"       ? "Class 3 — Moderate" :
        sv === "minor"          ? "Class 2 — Minor"    :
        sv === "not_significant"? "Class 1 — Not Sig." : "Unclassified";
      const dtStr = a.tempDeltaC != null ? `${a.tempDeltaC}°C` : "⚠ Not Recorded";
      return [
        "", // IR thumbnail via didDrawCell
        "", // RGB thumbnail
        a.type,
        a.panelLocation || "—",
        svLabel + (a.tempDeltaC == null ? " (Non-compliant — ΔT missing)" : ""),
        dtStr,
        (a.modulesAffected || 1).toString(),
        a.notes || "",
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255], fontSize: 7.5 },
    bodyStyles: { minCellHeight: 86, valign: "middle", fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 82 },
      1: { cellWidth: 82 },
      2: { cellWidth: 105 },
      3: { cellWidth: 65 },
      4: { cellWidth: 80 },
      5: { cellWidth: 38 },
      6: { cellWidth: 32 },
    },
    didDrawCell: (data) => {
      if (data.section !== "body") return;
      const a = anomalies[data.row.index];
      if (!a) return;

      if (data.column.index === 0 && a.thumbnail) {
        try { doc.addImage(a.thumbnail, "JPEG", data.cell.x + 3, data.cell.y + 3, 76, 80); } catch {}
      }
      if (data.column.index === 1 && a.rgbThumbnail) {
        try { doc.addImage(a.rgbThumbnail, "JPEG", data.cell.x + 3, data.cell.y + 3, 76, 80); } catch {}
      }
      // Severity color badge
      if (data.column.index === 4) {
        const sv = getSeverityFromDelta(a.tempDeltaC);
        const colors: Record<string, RGB> = {
          critical: [239, 68, 68], moderate: [202, 138, 4],
          minor: [16, 185, 129], not_significant: [113, 113, 122],
          unclassified: [63, 63, 70],
        };
        const col = colors[sv] ?? [100, 100, 100];
        doc.setFillColor(...col);
        doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, 14, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        const svShort = sv === "critical" ? "Class 4 — CRITICAL" : sv === "moderate" ? "Class 3 — MODERATE" : sv === "minor" ? "Class 2 — MINOR" : sv === "not_significant" ? "Class 1 — NOT SIG." : "UNCLASSIFIED";
        doc.text(svShort, data.cell.x + data.cell.width / 2, data.cell.y + 11, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      }
      // ΔT missing flag
      if (data.column.index === 5 && a.tempDeltaC == null) {
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text("Non-compliant\n— ΔT missing", data.cell.x + 2, data.cell.y + 14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
      }
    },
    margin: { left: ML, right: MR },
  });

  addPageFooter(doc, pg);

  // Save
  const safeName = (plantMeta.name || "Inspection").replace(/\s+/g, "_");
  doc.save(`${safeName}_IEC_Inspection_Report.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SITE SPECIFICATION EXPORT (Section 1 / Setup Tab Feature)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateSiteSpecPDF(plantMeta: PlantMetadata): Promise<void> {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF("p", "pt", "a4");
  const ML = 38;
  const pw = pageWidth(doc);

  // Cover Page (Branded)
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pw, pageHeight(doc), "F");
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, 6, pageHeight(doc), "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(plantMeta.name || "UNNAMED SOLAR PLANT", ML + 12, 170);

  doc.setFontSize(14);
  doc.setTextColor(...BRAND_GREEN);
  doc.text("Site Specification & Hardware Data Sheet", ML + 12, 196);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(190, 190, 190);
  doc.text(`Capacity: ${plantMeta.capacityMw} MW DC`, ML + 12, 320);
  doc.text(`Location: ${plantMeta.locationText || "N/A"}${plantMeta.lat ? ` (${plantMeta.lat.toFixed(4)}, ${plantMeta.lng?.toFixed(4)})` : ""}`, ML + 12, 342);
  doc.text(`Module: ${plantMeta.moduleBrand} ${plantMeta.moduleModel}`, ML + 12, 364);
  doc.text(`Inverter: ${plantMeta.inverterBrand} ${plantMeta.inverterModel}`, ML + 12, 386);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, ML + 12, 408);

  addPageFooter(doc, 1);

  // Technical Page
  doc.addPage();
  addPageHeader(doc, "SITE TECHNICAL CONFIGURATION");

  autoTable(doc, {
    startY: 55,
    head: [["Technical Specification", "System Configuration Value"]],
    body: [
      ["Plant Name", plantMeta.name || "N/A"],
      ["Latitude", plantMeta.lat?.toFixed(6) || "N/A"],
      ["Longitude", plantMeta.lng?.toFixed(6) || "N/A"],
      ["Total Capacity (MWp)", plantMeta.capacityMw.toString()],
      ["Total Module Count", plantMeta.modulesCount.toLocaleString()],
      ["", ""],
      ["[MODULE DATASHEET]", ""],
      ["Manufacturer", plantMeta.moduleBrand || "N/A"],
      ["Model Identifier", plantMeta.moduleModel || "N/A"],
      ["Power Rating (Wp)", `${plantMeta.modulePowerW} Wp`],
      ["Technology", plantMeta.moduleTechnology || "N/A"],
      ["Temp Coeff (Pmax)", `${plantMeta.tempCoeffPmax} %/°C`],
      ["NOCT", `${plantMeta.noct}°C`],
      ["Modules Per String", plantMeta.modulesPerString.toString()],
      ["", ""],
      ["[INVERTER DATASHEET]", ""],
      ["Manufacturer", plantMeta.inverterBrand || "N/A"],
      ["Model / Variant", plantMeta.inverterModel || "N/A"],
      ["Rating (kW)", `${plantMeta.inverterPowerKw} kW`],
      ["Mounting Architecture", plantMeta.mountType.toUpperCase()],
      ["", ""],
      ["[SPATIAL ASSETS]", ""],
      ["GeoJSON Layout", (plantMeta.layoutType === 'geojson' || plantMeta.layoutType === 'shapefile') ? `LOADED (${plantMeta.layoutType.toUpperCase()})` : "NONE"],
      ["Layout Reference", plantMeta.layoutFileName || "NONE"],
      ["Layout Mapping Mode", (plantMeta.layoutType === 'geojson' || plantMeta.layoutType === 'shapefile') ? "AUTOMATIC (GPS Intersection)" : "MANUAL"],
    ],
    theme: "grid",
    headStyles: { fillColor: ROW_DARK, textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 200, fontStyle: "bold" } },
    margin: { left: ML, right: ML },
    didParseCell: (d) => {
      if (d.section === "body" && d.cell.text[0].startsWith("[")) {
        d.cell.styles.fillColor = [39, 39, 42];
        d.cell.styles.textColor = [16, 185, 129];
      }
    }
  });

  addPageFooter(doc, 2);

  const safeName = (plantMeta.name || "Site_Specs").replace(/\s+/g, "_");
  doc.save(`${safeName}_Specifications.pdf`);
}
