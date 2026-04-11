import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LOSS_FACTORS, SeverityType, getSeverityFromDelta } from "./constants";

export { getSeverityFromDelta };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createObjectUrl(file: File | Blob) {
  return URL.createObjectURL(file);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getLossFactor(anomalyType: string): number {
  return LOSS_FACTORS[anomalyType] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — CALCULATION ENGINE (exact per specification)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * STEP 1 — IEC 60891 simplified single-coefficient procedure
 * Instantaneous module operating power at measured irradiance and temperature.
 * Used ONLY for instantaneous loss — NOT for annual projection.
 */
export function getPOperating(
  modulePowerWp: number,
  irradianceWm2: number,
  tempCoeffPmax: number, // %/°C e.g. -0.35
  moduleTempC: number
): number {
  const P_irr = modulePowerWp * (irradianceWm2 / 1000);
  const gamma = tempCoeffPmax / 100; // convert %/°C to fractional
  return P_irr * (1 + gamma * (moduleTempC - 25));
}

/**
 * STEP 2 — Instantaneous DC loss at time of inspection (kW)
 * Label in report: "Estimated DC loss at time of inspection (kW)"
 */
export function getDCLossInstant(
  modulesAffected: number,
  pOperatingW: number,
  lossFactor: number
): number {
  return (modulesAffected * pOperatingW * lossFactor) / 1000;
}

/**
 * STEP 3a — Annual DC loss basis at STC (kW)
 * Uses STC module power — NOT P_operating. PR already accounts for temp losses.
 * Using P_operating would double-correct for temperature — WRONG per spec.
 * Label: "Estimated annual energy loss projection (kWh/year)"
 */
export function getDCLossSTC(
  modulesAffected: number,
  modulePowerWp: number,
  lossFactor: number
): number {
  return (modulesAffected * modulePowerWp * lossFactor) / 1000;
}

/**
 * STEP 3b — Annual energy loss (kWh/year) per IEC 61724-1
 */
export function getAnnualKwhLoss(
  dcLossStcKw: number,
  annualPoaIrradiance: number, // kWh/m²/year
  performanceRatio: number     // dimensionless 0–1
): number {
  return dcLossStcKw * annualPoaIrradiance * performanceRatio;
}

/**
 * STEP 4 — Annual financial loss ($)
 */
export function getAnnualDollarLoss(
  annualKwhLoss: number,
  ppaRate: number
): number {
  return annualKwhLoss * ppaRate;
}

/**
 * STEP 5 — DC loss percentage
 * Per anomaly: (dc_loss_kw_stc / plant_capacity_kwp) × 100
 */
export function getDCLossPct(
  dcLossStcKw: number,
  plantCapacityKwp: number
): number {
  if (!plantCapacityKwp || plantCapacityKwp <= 0) return 0;
  return (dcLossStcKw / plantCapacityKwp) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL ANOMALY CALCULATION — all 5 steps in one call
// ─────────────────────────────────────────────────────────────────────────────
export interface AnomalyCalcResult {
  lossFactor: number;
  pOperatingW: number;
  dcLossInstantKw: number;
  dcLossStcKw: number;
  dcLossPct: number;
  annualKwhLoss: number;
  annualDollarLoss: number;
}

export function calcAnomaly(params: {
  anomalyType: string;
  modulesAffected: number;
  modulePowerWp: number;
  irradianceWm2: number;
  tempCoeffPmax: number;  // %/°C
  moduleTempC: number;
  annualPoaIrradiance: number;
  performanceRatio: number;
  ppaRate: number;
  plantCapacityKwp: number;
}): AnomalyCalcResult {
  const lossFactor = getLossFactor(params.anomalyType);
  const pOperatingW = getPOperating(
    params.modulePowerWp,
    params.irradianceWm2,
    params.tempCoeffPmax,
    params.moduleTempC
  );
  const dcLossInstantKw = getDCLossInstant(params.modulesAffected, pOperatingW, lossFactor);
  const dcLossStcKw = getDCLossSTC(params.modulesAffected, params.modulePowerWp, lossFactor);
  const dcLossPct = getDCLossPct(dcLossStcKw, params.plantCapacityKwp);
  const annualKwhLoss = getAnnualKwhLoss(dcLossStcKw, params.annualPoaIrradiance, params.performanceRatio);
  const annualDollarLoss = getAnnualDollarLoss(annualKwhLoss, params.ppaRate);

  return { lossFactor, pOperatingW, dcLossInstantKw, dcLossStcKw, dcLossPct, annualKwhLoss, annualDollarLoss };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — VALIDATION BEFORE REPORT GENERATION
// Returns array of error strings. Empty array = pass.
// ─────────────────────────────────────────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
  blocking: boolean; // false = warning, true = hard block
}

export function validateBeforeReport(params: {
  irradianceWm2: number | null;
  moduleTempC: number | null;
  tempCoeffPmax: number | null;
  plantCapacityKwp: number;
  ppaRate: number | null;
  annualPoaIrradiance: number | null;
  performanceRatio: number | null;
  anomalyCount: number;
  minModulesAffected: number; // min value across all anomalies
  totalDcPct: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (params.irradianceWm2 == null || params.irradianceWm2 <= 0) {
    errors.push({ field: "irradianceWm2", message: "Irradiance at inspection not entered", blocking: true });
  } else if (params.irradianceWm2 < 600) {
    errors.push({
      field: "irradianceWm2",
      message: `INSPECTION INVALID — IEC 62446-3 requires minimum 600 W/m² in-plane irradiance. Measured irradiance was ${params.irradianceWm2} W/m².`,
      blocking: true,
    });
  }
  if (params.moduleTempC == null) {
    errors.push({ field: "moduleTempC", message: "Module temperature not entered", blocking: true });
  }
  if (params.tempCoeffPmax == null || params.tempCoeffPmax === 0) {
    errors.push({ field: "tempCoeffPmax", message: "Temperature coefficient not entered", blocking: true });
  }
  if (!params.plantCapacityKwp || params.plantCapacityKwp <= 0) {
    errors.push({ field: "plantCapacity", message: "Plant capacity not entered", blocking: true });
  }
  if (!params.ppaRate || params.ppaRate <= 0) {
    errors.push({ field: "ppaRate", message: "PPA rate not entered", blocking: true });
  }
  if (!params.annualPoaIrradiance || params.annualPoaIrradiance <= 0) {
    errors.push({ field: "annualPoaIrradiance", message: "Annual POA irradiance not entered", blocking: true });
  }
  if (!params.performanceRatio || params.performanceRatio <= 0) {
    errors.push({ field: "performanceRatio", message: "Performance ratio not entered", blocking: true });
  }
  if (params.anomalyCount === 0) {
    errors.push({ field: "anomalies", message: "No anomalies have been annotated", blocking: true });
  }
  if (params.minModulesAffected < 1) {
    errors.push({ field: "modulesAffected", message: "One or more anomalies have 0 modules — check entries", blocking: true });
  }
  if (params.totalDcPct > 100) {
    errors.push({
      field: "totalDcPct",
      message: "Total DC loss exceeds 100% of plant capacity. Verify module count entries — this is a data error.",
      blocking: true,
    });
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backwards-compat wrapper for old code that calls calculateFinancialImpact
// ─────────────────────────────────────────────────────────────────────────────
export function calculateFinancialImpact(
  anomalyType: string,
  modulesAffected: number,
  modulePowerWp: number,
  ppaRate: number,
  annualSunlightHours: number // treated as annualPoaIrradiance × PR ≈ old sunlightHours
) {
  const lossFactor = getLossFactor(anomalyType);
  const affectedDCkW = (modulesAffected * modulePowerWp * lossFactor) / 1000;
  const annualKwh = affectedDCkW * annualSunlightHours;
  const annualImpactDollar = annualKwh * ppaRate;
  return { affectedDCkW, annualKwh, annualImpactDollar, lossFactor };
}
