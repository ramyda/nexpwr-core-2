// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY — IEC 62446-3 Table 1 (ΔT-based classification only)
// ─────────────────────────────────────────────────────────────────────────────
export type SeverityType = "critical" | "moderate" | "minor" | "not_significant" | "unclassified";

export interface IECSeverityClass {
  label: string;
  color: string;          // Tailwind bg+text for badges
  strokeColor: string;    // Canvas stroke hex
  action: string;
}

export const IEC_SEVERITY_CLASSES: Record<SeverityType, IECSeverityClass> = {
  critical: {
    label: "Class 4 — Critical",
    color: "bg-red-500 text-white",
    strokeColor: "#EF4444",
    action: "Repair immediately. Assess fire risk before leaving operational.",
  },
  moderate: {
    label: "Class 3 — Moderate",
    color: "bg-yellow-400 text-black",
    strokeColor: "#FBBF24",
    action: "Repair within 1–3 months.",
  },
  minor: {
    label: "Class 2 — Minor",
    color: "bg-emerald-500 text-white",
    strokeColor: "#10B981",
    action: "Schedule repair at next planned maintenance.",
  },
  not_significant: {
    label: "Class 1 — Not Significant",
    color: "bg-zinc-500 text-white",
    strokeColor: "#71717A",
    action: "No immediate action. Re-inspect at next scheduled survey.",
  },
  unclassified: {
    label: "Unclassified",
    color: "bg-zinc-700 text-zinc-300",
    strokeColor: "#52525B",
    action: "ΔT not recorded — IEC 62446-3 classification cannot be assigned.",
  },
};

// Backwards-compatible color maps
export const SEVERITY_COLORS: Record<SeverityType, string> = Object.fromEntries(
  Object.entries(IEC_SEVERITY_CLASSES).map(([k, v]) => [k, v.color])
) as Record<SeverityType, string>;

export const SEVERITY_STROKE_COLORS: Record<SeverityType, string> = Object.fromEntries(
  Object.entries(IEC_SEVERITY_CLASSES).map(([k, v]) => [k, v.strokeColor])
) as Record<SeverityType, string>;

// ─────────────────────────────────────────────────────────────────────────────
// IEC 62446-3 ΔT → Severity classification function
// SECTION 5: Severity determined ONLY by ΔT. Never by loss factor. Never by type.
// ─────────────────────────────────────────────────────────────────────────────
export function getSeverityFromDelta(tempDeltaC: number | null | undefined): SeverityType {
  if (tempDeltaC == null || isNaN(tempDeltaC)) return "unclassified";
  if (tempDeltaC < 3) return "not_significant";
  if (tempDeltaC < 10) return "minor";
  if (tempDeltaC < 20) return "moderate";
  return "critical";
}

// ─────────────────────────────────────────────────────────────────────────────
// LOSS FACTORS — SECTION 3 (exact values from specification)
// MUST show disclaimer everywhere: these are NOT from any IEC standard.
// ─────────────────────────────────────────────────────────────────────────────
export const LOSS_FACTORS: Record<string, number> = {
  "Short circuited module":        1.00,
  "Substring short circuited":     0.33,
  "Missing module":                1.00,
  "Severe multicell hotspot":      0.50,
  "Multi-cell hotspot":            0.35,
  "Junction box failure":          0.80,
  "Bypass diode activated":        0.33,
  "Diode short circuit":           0.33,
  "Potential induced degradation": 0.25,
  "Delamination":                  0.20,
  "Glass breakage":                0.30,
  "Cell crack (inactive)":         0.15,
  "Single cell hotspot":           0.10,
  "Foreign object shading":        0.10,
  "Soiling":                       0.05,
  "Shadow":                        0.05,
  "Vegetation encroachment":       0.10,
  "Wrongly inclined module":       0.05,
  "Bird dropping":                 0.03,
  "Connector issue":               0.50,
};

// Ordered array of anomaly type names for dropdowns
export const ANOMALY_TYPE_NAMES = Object.keys(LOSS_FACTORS);

// Backwards-compat legacy ANOMALY_TYPES shape (without pre-assigned severity — severity is from ΔT now)
export const ANOMALY_TYPES = ANOMALY_TYPE_NAMES.map(name => ({
  name,
  lossFactor: LOSS_FACTORS[name],
  // Legacy severity kept for any old code that reads it — UI should use getSeverityFromDelta instead
  severity: "minor" as SeverityType,
}));

// ─────────────────────────────────────────────────────────────────────────────
// MANDATORY DISCLAIMERS — SECTION 13 & SECTION 12
// Print in executive summary, findings table header, and footnote ⑥
// ─────────────────────────────────────────────────────────────────────────────
export const POWER_LOSS_DISCLAIMER =
  "Power loss values are estimated using manufacturer STC ratings corrected for measured module temperature per IEC 60891 (simplified procedure). Loss factors are engineering estimates based on industry practice and are not defined by any IEC standard. Definitive power loss quantification requires I-V curve tracing per IEC 60891. All financial impact figures are estimates and should not be used as the sole basis for contractual claims without I-V curve verification.";

// ─────────────────────────────────────────────────────────────────────────────
// IEC 62446-3 MANDATORY STATEMENT — SECTION 4 CHECK 3
// Print on inspection conditions page
// ─────────────────────────────────────────────────────────────────────────────
export const IEC_THERMAL_EQUILIBRIUM_STATEMENT =
  "Per IEC 62446-3, the PV system must have been operating continuously at or near full rated power for a minimum of 1 hour prior to the thermographic survey to ensure thermal equilibrium.";

// ─────────────────────────────────────────────────────────────────────────────
// PDF FOOTER TEXT — SECTION 11 (print on EVERY page, NO IEC 61215)
// ─────────────────────────────────────────────────────────────────────────────
export const PDF_PAGE_FOOTER =
  "Thermographic inspection methodology per IEC 62446-3:2017. Temperature correction per IEC 60891 (simplified single-coefficient procedure). Annual performance analysis per IEC 61724-1:2021. Power loss factors are engineering estimates; definitive assessment requires I-V curve tracing per IEC 60891.";
