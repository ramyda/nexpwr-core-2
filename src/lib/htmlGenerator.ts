import { Anomaly, InspectionMetadata, PlantMetadata } from "./store";
import { getSeverityFromDelta } from "./constants";
import { calcAnomaly, formatDate, getDCLossPct } from "./utils";
import { preflightCheck } from "./pdfGenerator";

export async function generateRaptorHTML(
  anomalies: Anomaly[],
  plantMeta: PlantMetadata,
  inspMeta: InspectionMetadata
): Promise<void> {
  const preflight = preflightCheck(anomalies, plantMeta, inspMeta);
  if (!preflight.ok) {
    throw new Error(preflight.blockingErrors.join("\n\n"));
  }

  const plantCapacityKwp = plantMeta.capacityMw * 1000;
  const windHigh = inspMeta.windSpeedMs > 4;
  const irradianceValid = inspMeta.irradianceWm2 >= 600;

  // Pre-compute aggregates
  const rowMap: Record<string, any> = {};
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

  const rows = Object.values(rowMap);
  rows.forEach(row => {
    row.dcPct = getDCLossPct(row.dcStcKw, plantCapacityKwp);
  });

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

  let findingsHTML = "";
  if (rows.length === 0) {
    findingsHTML = `<tr><td colspan="9" style="text-align: center; color: #64748B; font-style: italic;">No anomalies recorded.</td></tr>`;
  } else {
    findingsHTML = rows.map(r => `
      <tr>
        <td>${r.anomalyType}</td>
        <td>${r.count}</td>
        <td>${r.modules}</td>
        <td>${r.dcInstantKw.toFixed(3)}</td>
        <td>${r.dcStcKw.toFixed(3)}</td>
        <td>${r.dcPct.toFixed(3)}%</td>
        <td>${Math.round(r.annualKwh).toLocaleString()}</td>
        <td>$${r.annualDollar.toFixed(2)}</td>
        <td>—</td>
      </tr>
    `).join("");
  }

  let anomaliesHTML = "";
  if (anomalies.length === 0) {
    anomaliesHTML = `<div style="color: #64748B; font-style: italic; font-size: 12px; margin-bottom: 20px;">No anomaly data provided.</div>`;
  } else {
    anomaliesHTML = anomalies.map(a => {
      const sv = getSeverityFromDelta(a.tempDeltaC);
      let classBadgeStr = "";
      if (sv === "critical") classBadgeStr = `<span class="pill pill-red">Class 4</span>`;
      else if (sv === "moderate") classBadgeStr = `<span class="pill pill-amber">Class 3</span>`;
      else if (sv === "minor") classBadgeStr = `<span class="pill pill-blue">Class 2</span>`;
      else if (sv === "not_significant") classBadgeStr = `<span class="pill pill-green">Class 1</span>`;
      else classBadgeStr = `<span class="pill pill-gray">Unclassified</span>`;

      const irAsset = a.thumbnail ? `<img src="${a.thumbnail}" style="width:100%; height:100%; object-fit:cover;" />` : `<div class="img-box img-ir">IR Thermal</div>`;
      const rgbAsset = a.rgbThumbnail ? `<img src="${a.rgbThumbnail}" style="width:100%; height:100%; object-fit:cover;" />` : `<div class="img-box img-rgb">RGB Visual</div>`;

      return `
      <div class="anomaly-card avoid-break">
        <div class="anomaly-images">
          <div style="width: 80px; height: 65px; border-radius: 4px; overflow: hidden; background: #1a0a2e; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff;">${irAsset}</div>
          <div style="width: 80px; height: 65px; border-radius: 4px; overflow: hidden; background: #0a1628; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff;">${rgbAsset}</div>
        </div>
        <div class="anomaly-details">
          <div class="anomaly-header">
            <div style="font-weight: bold;">${a.type}</div>
            <div>${classBadgeStr}</div>
          </div>
          <div class="anomaly-meta">
            <span class="anomaly-meta-label">Location:</span>
            <span class="anomaly-meta-value">${a.panelLocation || "—"}</span>
            <span class="anomaly-meta-label">ΔT:</span>
            <span class="anomaly-meta-value">${a.tempDeltaC != null ? a.tempDeltaC + "°C" : "N/R"}</span>
            <span class="anomaly-meta-label">Modules:</span>
            <span class="anomaly-meta-value">${a.modulesAffected || 1}</span>
          </div>
          ${a.notes ? `<div class="anomaly-notes"><span style="font-weight:bold;">Notes:</span> ${a.notes}</div>` : ""}
        </div>
      </div>
      `;
    }).join("");
  }

  // Pre-calculate full static map HTML block
  let geoMapHTML = "";
  const mapAnomalies = anomalies.filter(a => a.lat !== undefined && a.lng !== undefined);
  if (mapAnomalies.length > 0) {
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

     const rows = mapAnomalies.map(a => `
       <tr>
         <td>${a.id.slice(0,8)}</td>
         <td>${a.type}</td>
         <td>${a.severity.toUpperCase()}</td>
         <td>${a.tempDeltaC != null ? a.tempDeltaC + '°C' : 'N/A'}</td>
         <td>${a.lat?.toFixed(6)}, ${a.lng?.toFixed(6)}</td>
         <td>${a.panelLocation || "—"}</td>
       </tr>
     `).join("");

     geoMapHTML = `
       <div class="page-break"></div>
       <div class="section-header">Anomaly Location Map</div>
       <img src="${mapUrl}" class="static-map-img" alt="Map over OSM" />
       <table>
         <thead>
             <tr>
                 <th>Annotation ID</th>
                 <th>Anomaly Type</th>
                 <th>IEC Class</th>
                 <th>ΔT</th>
                 <th>GPS Coordinates</th>
                 <th>String/Location</th>
             </tr>
         </thead>
         <tbody>
             ${rows}
         </tbody>
       </table>
     `;
  }


  const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NexPwr Aerial Thermographic PV Inspection Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #FFFFFF; font-family: 'DM Sans', sans-serif; color: #0F172A; font-size: 13px; line-height: 1.6; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact; }
        .report-container { max-width: 860px; margin: 0 auto; padding: 40px 20px; }
        @media print {
            body { background-color: #FFFFFF; }
            .report-container { padding: 0; }
            .page-break { page-break-before: always; margin-top: 40px; }
            .avoid-break { page-break-inside: avoid; }
            @page { size: A4; margin: 15mm; }
        }
        .bg-uc { background-color: #64748B; }
        .anomaly-card { border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px; margin-bottom: 15px; display: flex; gap: 20px; page-break-inside: avoid; }
        .anomaly-images { display: flex; gap: 10px; flex-shrink: 0; }
        .anomaly-details { flex-grow: 1; }
        .anomaly-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; }
        .anomaly-meta { display: grid; grid-template-columns: auto 1fr; column-gap: 20px; row-gap: 5px; font-size: 11px; }
        .anomaly-meta-label { color: #64748B; }
        .anomaly-meta-value { font-weight: 500; }
        .anomaly-notes { margin-top: 10px; font-size: 11px; color: #475569; background-color: #F8FAFC; padding: 8px; border-radius: 4px; }
        .def-card { border: 1px solid #E2E8F0; border-left: 3px solid #0F172A; padding: 15px; margin-bottom: 15px; border-radius: 4px; page-break-inside: avoid; }
        .def-title { font-weight: 700; font-size: 13px; margin-bottom: 10px; color: #0F172A; }
        .def-prop { margin-bottom: 4px; font-size: 12px; }
        .footer { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; margin-top: 40px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #64748B; }
        .static-map-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 15px; }
        .section-header { text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; border-left: 3px solid #16A34A; padding-left: 10px; margin: 40px 0 20px 0; font-weight: 700; color: #166534; }
        .text-bold { font-weight: 700; }
        .pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .pill-green { background-color: #16A34A; color: #FFFFFF; }
        .pill-red { background-color: #DC2626; color: #FFFFFF; }
        .pill-amber { background-color: #D97706; color: #FFFFFF; }
        .pill-blue { background-color: #2563EB; color: #FFFFFF; }
        .pill-gray { background-color: #64748B; color: #FFFFFF; }
        .top-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .top-brand svg { width: 24px; height: 24px; fill: #16A34A; }
        .brand-text { font-weight: 700; font-size: 14px; color: #0F172A; }
        .brand-subtitle { font-weight: 400; color: #64748B; }
        .cover-hero { background-color: #0F172A; color: #FFFFFF; padding: 40px; border-radius: 8px; }
        .hero-title { font-size: 28px; font-weight: 700; margin: 15px 0 5px 0; line-height: 1.2; }
        .hero-tagline { color: #94A3B8; font-size: 13px; margin-bottom: 40px; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
        .meta-card { background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; }
        .meta-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; margin-bottom: 5px; }
        .meta-value { font-size: 14px; font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 8px; }
        .iec-badges { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }
        .iec-badge { background-color: rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 4px; font-size: 10px; color: #CBD5E1; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .kpi-card { background-color: #F8FAFC; padding: 20px; border-radius: 6px; border: 1px solid #E2E8F0; text-align: center; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #0F172A; margin-bottom: 5px; }
        .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th, td { padding: 10px 12px; border: 0.5px solid #E2E8F0; text-align: left; }
        th { background-color: #0F172A; color: #FFFFFF; font-weight: 500; }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .table-total { font-weight: 700; color: #166534; background-color: #F0FDF4 !important; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .spec-list { list-style: none; padding: 0; margin: 0; }
        .spec-list li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
        .spec-list li:last-child { border-bottom: none; }
        .spec-label { color: #64748B; }
        .spec-value { font-weight: 500; text-align: right; }
        .disclaimer { background-color: #FFFBEB; border: 1px solid #FCD34D; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400E; font-size: 11px; }
        .footnotes { font-family: monospace; font-size: 10px; color: #64748B; margin-top: 15px; line-height: 1.4; }
        .severity-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .severity-card { padding: 15px 10px; border-radius: 6px; color: #FFFFFF; text-align: center; }
        .severity-card .class-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.9; }
        .severity-card .class-title { font-size: 12px; font-weight: 700; margin: 2px 0 8px 0; }
        .severity-card .class-desc { font-size: 10px; opacity: 0.8; line-height: 1.2; height: 30px; }
        .severity-card .class-count { font-size: 24px; font-weight: 700; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px; }
        .bg-c4 { background-color: #DC2626; }
        .bg-c3 { background-color: #D97706; }
        .bg-c2 { background-color: #2563EB; }
        .bg-c1 { background-color: #16A34A; }
        .bg-uc { background-color: #64748B; }
        .anomaly-card { border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px; margin-bottom: 15px; display: flex; gap: 20px; page-break-inside: avoid; }
        .anomaly-images { display: flex; gap: 10px; flex-shrink: 0; }
        .anomaly-details { flex-grow: 1; }
        .anomaly-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; }
        .anomaly-meta { display: grid; grid-template-columns: auto 1fr; column-gap: 20px; row-gap: 5px; font-size: 11px; }
        .anomaly-meta-label { color: #64748B; }
        .anomaly-meta-value { font-weight: 500; }
        .anomaly-notes { margin-top: 10px; font-size: 11px; color: #475569; background-color: #F8FAFC; padding: 8px; border-radius: 4px; }
        .def-card { border: 1px solid #E2E8F0; border-left: 3px solid #0F172A; padding: 15px; margin-bottom: 15px; border-radius: 4px; page-break-inside: avoid; }
        .def-title { font-weight: 700; font-size: 13px; margin-bottom: 10px; color: #0F172A; }
        .def-prop { margin-bottom: 4px; font-size: 12px; }
        .footer { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; margin-top: 40px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #64748B; }
    </style>
</head>
<body>

<div class="report-container">

    <!-- PAGE 1: COVER -->
    <div class="top-brand">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
        </svg>
        <div>
            <div class="brand-text">NexPwr by Elytrus Pvt. Ltd.</div>
            <div class="brand-subtitle">Aerial Intelligence</div>
        </div>
    </div>

    <div class="cover-hero">
        <div class="pill pill-green">● IEC 62446-3:2017 COMPLIANT</div>
        <h1 class="hero-title">Aerial Thermographic<br>PV Inspection Report</h1>
        <div class="hero-tagline">Precision. Performance. Power.</div>

        <div class="meta-grid">
            <div class="meta-card">
                <div class="meta-label">Plant Name</div>
                <div class="meta-value">${plantMeta.name || "—"}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Location</div>
                <div class="meta-value">${plantMeta.locationText || "—"}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Plant Capacity</div>
                <div class="meta-value">${plantCapacityKwp} kWp</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Inspection Date</div>
                <div class="meta-value">${formatDate(inspMeta.date)}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Operator</div>
                <div class="meta-value">${inspMeta.operator || "—"}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">Irradiance</div>
                <div class="meta-value">${inspMeta.irradianceWm2} W/m² ${irradianceValid ? '<span class="pill pill-green" style="font-size: 8px; padding: 2px 6px;">✓ Pass</span>' : '<span class="pill pill-red" style="font-size: 8px; padding: 2px 6px;">✗ Fail</span>'}</div>
            </div>
        </div>

        <div class="iec-badges">
            <div class="iec-badge">IEC 62446-3:2017</div>
            <div class="iec-badge">IEC 60891 Temp Correction</div>
            <div class="iec-badge">IEC 61724-1:2021</div>
            <div class="iec-badge">Drone: ${inspMeta.droneModel || "—"}</div>
            <div class="iec-badge">Sensor: ${inspMeta.cameraModel || "—"}</div>
        </div>
    </div>

    <!-- SECTION 1: EXECUTIVE SUMMARY -->
    <div class="page-break"></div>
    <div class="section-header">Executive Summary</div>
    
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-value">${anomalies.length}</div>
            <div class="kpi-label">Total Anomalies</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${totalModules}</div>
            <div class="kpi-label">Modules Affected</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${totalDcPct.toFixed(2)}%</div>
            <div class="kpi-label">DC Loss %</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">$${totalAnnualDollar.toFixed(2)}</div>
            <div class="kpi-label">Annual Financial Loss</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>IEC Class</th>
                <th>C4 Critical</th>
                <th>C3 Moderate</th>
                <th>C2 Minor</th>
                <th>C1 Not Significant</th>
                <th>Unclassified</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Count</strong></td>
                <td class="text-bold" style="color: #DC2626;">${class4Count || "—"}</td>
                <td class="text-bold" style="color: #D97706;">${class3Count || "—"}</td>
                <td class="text-bold" style="color: #2563EB;">${class2Count || "—"}</td>
                <td class="text-bold" style="color: #16A34A;">${class1Count || "—"}</td>
                <td class="text-bold" style="color: #64748B;">${unclassifiedCount || "—"}</td>
            </tr>
        </tbody>
    </table>

    <!-- SECTION 2: SITE OVERVIEW -->
    <div class="page-break"></div>
    <div class="section-header">Site Overview</div>

    <div class="two-col">
        <div>
            <h3 style="font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Plant Specifications</h3>
            <ul class="spec-list">
                <li><span class="spec-label">Module Make & Model</span> <span class="spec-value">${plantMeta.moduleBrand} ${plantMeta.moduleModel}</span></li>
                <li><span class="spec-label">STC Power (Wp)</span> <span class="spec-value">${plantMeta.modulePowerW}</span></li>
                <li><span class="spec-label">Technology</span> <span class="spec-value">${plantMeta.moduleTechnology || "—"}</span></li>
                <li><span class="spec-label">Temp. Coeff. Pmax</span> <span class="spec-value">${plantMeta.tempCoeffPmax} %/°C</span></li>
                <li><span class="spec-label">NOCT</span> <span class="spec-value">${plantMeta.noct}°C</span></li>
                <li><span class="spec-label">Modules Per String</span> <span class="spec-value">${plantMeta.modulesPerString}</span></li>
                <li><span class="spec-label">Inverter</span> <span class="spec-value">${plantMeta.inverterBrand} ${plantMeta.inverterModel}</span></li>
                <li><span class="spec-label">Mount Type</span> <span class="spec-value">${plantMeta.mountType}</span></li>
                <li><span class="spec-label">Total Modules</span> <span class="spec-value">${plantMeta.modulesCount}</span></li>
            </ul>
        </div>
        <div>
            <h3 style="font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Inspection Conditions</h3>
            <ul class="spec-list">
                <li><span class="spec-label">Drone / Platform</span> <span class="spec-value">${inspMeta.droneModel || "—"}</span></li>
                <li><span class="spec-label">Thermal Sensor</span> <span class="spec-value">${inspMeta.cameraModel || "—"}</span></li>
                <li><span class="spec-label">Ambient Temperature</span> <span class="spec-value">${inspMeta.weatherTempC}°C</span></li>
                <li><span class="spec-label">Humidity</span> <span class="spec-value">${inspMeta.weatherHumidity}%</span></li>
                <li><span class="spec-label">Wind Speed</span> <span class="spec-value">${inspMeta.windSpeedMs} m/s ${windHigh ? '⚠' : ''}</span></li>
                <li><span class="spec-label">Cloud Cover</span> <span class="spec-value">${inspMeta.weatherCloudCover}%</span></li>
                <li><span class="spec-label">Irradiance</span> <span class="spec-value">${inspMeta.irradianceWm2} W/m² ${irradianceValid ? '✓' : '✗'}</span></li>
                <li><span class="spec-label">Module Backsheet Temp.</span> <span class="spec-value">${inspMeta.moduleTempC}°C</span></li>
                <li><span class="spec-label">Emissivity</span> <span class="spec-value">${inspMeta.cameraEmissivity}</span></li>
                <li><span class="spec-label">Min. ΔT Threshold</span> <span class="spec-value">${inspMeta.minTempDeltaThreshold}°C</span></li>
                <li><span class="spec-label">Annual POA Irradiance</span> <span class="spec-value">${inspMeta.annualPoaIrradiance}</span></li>
                <li><span class="spec-label">Performance Ratio</span> <span class="spec-value">${inspMeta.performanceRatio}</span></li>
                <li><span class="spec-label">PPA Rate</span> <span class="spec-value">$${inspMeta.ppaRate}</span></li>
            </ul>
        </div>
    </div>

    <!-- SECTION 3: IEC 62446-3 COMPLIANCE TABLE -->
    <div class="section-header">IEC 62446-3 Compliance Table</div>

    <table>
        <thead>
            <tr>
                <th>Parameter</th>
                <th>IEC Requirement</th>
                <th>Measured Value</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-left: 3px solid ${irradianceValid ? '#16A34A' : '#DC2626'};">
                <td>Irradiance</td>
                <td>≥ 600 W/m²</td>
                <td>${inspMeta.irradianceWm2}</td>
                <td><span class="pill ${irradianceValid ? 'pill-green' : 'pill-red'}">${irradianceValid ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr style="border-left: 3px solid ${inspMeta.moduleTempC > 0 ? '#16A34A' : '#DC2626'};">
                <td>Module Backsheet Temp.</td>
                <td>&gt; Ambient</td>
                <td>${inspMeta.moduleTempC}</td>
                <td><span class="pill ${inspMeta.moduleTempC > 0 ? 'pill-green' : 'pill-red'}">${inspMeta.moduleTempC > 0 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr style="border-left: 3px solid ${!windHigh ? '#16A34A' : '#DC2626'};">
                <td>Wind Speed</td>
                <td>≤ 4 m/s</td>
                <td>${inspMeta.windSpeedMs}</td>
                <td><span class="pill ${!windHigh ? 'pill-green' : 'pill-red'}">${!windHigh ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr style="border-left: 3px solid ${inspMeta.cameraEmissivity > 0 ? '#16A34A' : '#DC2626'};">
                <td>Camera Emissivity</td>
                <td>0.85</td>
                <td>${inspMeta.cameraEmissivity}</td>
                <td><span class="pill ${inspMeta.cameraEmissivity > 0 ? 'pill-green' : 'pill-red'}">${inspMeta.cameraEmissivity > 0 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr style="border-left: 3px solid ${inspMeta.minTempDeltaThreshold > 0 ? '#16A34A' : '#DC2626'};">
                <td>Min. ΔT Threshold</td>
                <td>≥ 3°C</td>
                <td>${inspMeta.minTempDeltaThreshold}</td>
                <td><span class="pill ${inspMeta.minTempDeltaThreshold > 0 ? 'pill-green' : 'pill-red'}">${inspMeta.minTempDeltaThreshold > 0 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
        </tbody>
    </table>

    <!-- SECTION 4: FINDINGS — FINANCIAL IMPACT -->
    <div class="page-break"></div>
    <div class="section-header">Findings — Financial Impact</div>

    <table>
        <thead>
            <tr>
                <th>Anomaly Type</th>
                <th>Count</th>
                <th>Modules</th>
                <th>DC Instant (kW)</th>
                <th>DC STC (kW)</th>
                <th>DC Loss %</th>
                <th>Annual kWh Loss</th>
                <th>Annual Loss ($)</th>
                <th>IEC Class</th>
            </tr>
        </thead>
        <tbody>
            ${findingsHTML}
            <tr class="table-total">
                <td>TOTALS</td>
                <td>${anomalies.length}</td>
                <td>${totalModules}</td>
                <td>${totalDcInstant.toFixed(3)}</td>
                <td>${totalDcStc.toFixed(3)}</td>
                <td>${totalDcPct.toFixed(3)}%</td>
                <td>${Math.round(totalAnnualKwh).toLocaleString()}</td>
                <td>$${totalAnnualDollar.toFixed(2)}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <div class="disclaimer">
        <strong>⚠ Engineering Estimate Disclaimer:</strong> Power loss values are engineering estimates corrected for measured module temperature per IEC 60891 (simplified procedure). Loss factors are derived from industry practice and are not published by IEC 62446-3. Definitive power loss quantification requires I-V curve tracing per IEC 60891. Financial figures should not be used as the sole basis for contractual claims without I-V curve verification.
    </div>

    <div class="footnotes">
        [1] DC Instant (kW) = Modules × Module Operating Power (corrected per IEC 60891) × Loss Factor ÷ 1000<br>
        [2] DC STC (kW) = Modules × Module STC Power × Loss Factor ÷ 1000<br>
        [3] Annual kWh = DC STC (kW) × Annual POA (kWh/m²/yr) × Performance Ratio<br>
        [4] Annual $ = Annual kWh × PPA Rate ($/kWh)<br>
        [5] DC Loss % = DC STC (kW) ÷ Plant STC Capacity (kWp) × 100<br>
        [6] Module Operating Power = STC Power × [1 + Pmax_coeff × (T_module − 25)] × (G / 1000)
    </div>

    <!-- SECTION 5: SEVERITY CLASSIFICATION -->
    <div class="page-break"></div>
    <div class="section-header">Severity Classification</div>

    <div class="severity-grid">
        <div class="severity-card bg-c4">
            <div class="class-label">CLASS 4</div>
            <div class="class-title">CRITICAL</div>
            <div class="class-desc">ΔT ≥ 20°C<br>Immediate action</div>
            <div class="class-count">${class4Count}</div>
        </div>
        <div class="severity-card bg-c3">
            <div class="class-label">CLASS 3</div>
            <div class="class-title">MODERATE</div>
            <div class="class-desc">ΔT 10–20°C<br>≤ 1 month</div>
            <div class="class-count">${class3Count}</div>
        </div>
        <div class="severity-card bg-c2">
            <div class="class-label">CLASS 2</div>
            <div class="class-title">MINOR</div>
            <div class="class-desc">ΔT 3–10°C<br>Monitor / schedule</div>
            <div class="class-count">${class2Count}</div>
        </div>
        <div class="severity-card bg-c1">
            <div class="class-label">CLASS 1</div>
            <div class="class-title">NOT SIGNIF.</div>
            <div class="class-desc">ΔT 0–3°C<br>Log only</div>
            <div class="class-count">${class1Count}</div>
        </div>
        <div class="severity-card bg-uc">
            <div class="class-label">UNCLASSIFIED</div>
            <div class="class-title">N/A</div>
            <div class="class-desc">ΔT not rec.<br>Re-inspect required</div>
            <div class="class-count">${unclassifiedCount}</div>
        </div>
    </div>

    ${geoMapHTML}

    <!-- SECTION 6: ANOMALY LOCATION CATALOG -->
    <div class="page-break"></div>
    <div class="section-header">Anomaly Location Catalog</div>
    
    ${anomaliesHTML}

    <!-- SECTION 7: APPENDIX — ANOMALY DEFINITIONS -->
    <div class="page-break"></div>
    <div class="section-header">Appendix — Anomaly Definitions</div>

    <div class="def-card">
        <div class="def-title">MISSING MODULE</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Module absent from racking — no thermal signature visible.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Theft, storm damage, or commissioning omission.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Verify against as-built drawing; replace immediately.</div>
    </div>
    <div class="def-card">
        <div class="def-title">HOT SPOT</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Localised high-temperature area within a single cell (ΔT ≥ threshold).</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Cell crack, shading, contamination, or manufacturing defect.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Class-dependent — C4: replace within 48h; C3: replace within 1 month; C2: schedule.</div>
    </div>
    <div class="def-card">
        <div class="def-title">DIODE FAULT</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Entire bypass diode region (typically 1/3 of module) uniformly heated.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Bypass diode short circuit or open circuit.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Replace module. Risk of fire if unaddressed.</div>
    </div>
    <div class="def-card">
        <div class="def-title">MODULE FAULT</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Entire module uniformly elevated above neighboring modules.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Internal delamination, glass breakage, junction box failure.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Replace module; high priority.</div>
    </div>
    <div class="def-card">
        <div class="def-title">STRING FAULT</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> All modules in a series string showing consistent heating pattern.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Open circuit, connector failure, fuse blown, inverter MPPT fault.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Electrically test string; trace fault at combiner box.</div>
    </div>
    <div class="def-card">
        <div class="def-title">UNDERPERFORMING STRING</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> String shows lower-than-expected output without clear thermal hot spot.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Partial soiling, shading, inverter clipping, or degraded modules.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Check IV curve; clean panels; inspect shading sources.</div>
    </div>
    <div class="def-card">
        <div class="def-title">PID (SUSPECTED)</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Modules near grounding edges show elevated temperature pattern.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Potential-induced degradation from voltage bias to ground.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> PID recovery test; check inverter grounding; replace affected modules.</div>
    </div>
    <div class="def-card">
        <div class="def-title">CELL FAULT</div>
        <div class="def-prop"><span class="text-bold">Thermal:</span> Individual cell or sub-cell shows elevated temperature.</div>
        <div class="def-prop"><span class="text-bold">Cause:</span> Micro-crack, cell mismatch, or localised contamination.</div>
        <div class="def-prop"><span class="text-bold">Action:</span> Monitor; escalate if ΔT increases on re-inspection.</div>
    </div>

    <div class="footer">
        <div>NexPwr by Elytrus Pvt. Ltd. | Aerial Intelligence Division</div>
        <div>IEC 62446-3:2017 · IEC 60891 · IEC 61724-1:2021</div>
    </div>
</div>

</body>
</html>`;

  const blob = new Blob([htmlString], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (plantMeta.name || "Inspection").replace(/\s+/g, "_");
  a.download = `${safeName}_IEC_Report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
