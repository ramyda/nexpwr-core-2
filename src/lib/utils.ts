import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LOSS_FACTORS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────────────────────────
// Date formatter
// ─────────────────────────────────────────────────────────────────────────────
export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IEC 60891 intermediate calculation helpers
// Used by calcAnomaly, pdfGenerator, htmlGenerator
// ─────────────────────────────────────────────────────────────────────────────

/** Module operating power (W) corrected for measured irradiance & module temp */
export function getPOperating(
  modulePowerWp: number,
  irradianceWm2: number,
  tempCoeffPmax: number,
  moduleTempC: number
): number {
  const irradianceFactor = irradianceWm2 / 1000;
  const tempFactor = 1 + (tempCoeffPmax / 100) * (moduleTempC - 25);
  return modulePowerWp * irradianceFactor * tempFactor;
}

/** DC loss at inspection conditions (instantaneous) in kW */
export function getDCLossInstant(
  modulesAffected: number,
  pOperatingW: number,
  lossFactor: number
): number {
  return (modulesAffected * pOperatingW * lossFactor) / 1000;
}

/** DC loss on STC basis (for annual projection) in kW */
export function getDCLossSTC(
  modulesAffected: number,
  modulePowerWp: number,
  lossFactor: number
): number {
  return (modulesAffected * modulePowerWp * lossFactor) / 1000;
}

/** Annual energy loss in kWh/year */
export function getAnnualKwhLoss(
  dcLossStcKw: number,
  annualPoaIrradiance: number,
  performanceRatio: number
): number {
  return dcLossStcKw * annualPoaIrradiance * performanceRatio;
}

/** Annual financial loss in $/₹ */
export function getAnnualDollarLoss(annualKwhLoss: number, ppaRate: number): number {
  return annualKwhLoss * ppaRate;
}

/** DC Loss as percentage of plant capacity */
export function getDCLossPct(dcLossStcKw: number, plantCapacityKwp: number): number {
  if (plantCapacityKwp <= 0) return 0;
  return (dcLossStcKw / plantCapacityKwp) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation function
// ─────────────────────────────────────────────────────────────────────────────
export interface CalcAnomalyInput {
  anomalyType: string;
  modulesAffected: number;
  modulePowerWp: number;
  irradianceWm2: number;
  tempCoeffPmax: number;
  moduleTempC: number;
  annualPoaIrradiance: number;
  performanceRatio: number;
  ppaRate: number;
  plantCapacityKwp: number;
}

export interface CalcAnomalyResult {
  lossFactor: number;
  pOperatingW: number;
  dcLossInstantKw: number;
  dcLossStcKw: number;
  dcLossPct: number;
  annualKwhLoss: number;
  annualDollarLoss: number;
  // Alias kept for backwards compat
  dcLossKw: number;
  annKwh: number;
  annDollar: number;
}

export function calcAnomaly(input: CalcAnomalyInput): CalcAnomalyResult {
  const {
    anomalyType, modulesAffected, modulePowerWp,
    irradianceWm2, tempCoeffPmax, moduleTempC,
    annualPoaIrradiance, performanceRatio, ppaRate, plantCapacityKwp,
  } = input;

  const lossFactor = LOSS_FACTORS[anomalyType] ?? 0.1;
  const pOperatingW = getPOperating(modulePowerWp, irradianceWm2, tempCoeffPmax, moduleTempC);
  const dcLossInstantKw = getDCLossInstant(modulesAffected, pOperatingW, lossFactor);
  const dcLossStcKw = getDCLossSTC(modulesAffected, modulePowerWp, lossFactor);
  const dcLossPct = getDCLossPct(dcLossStcKw, plantCapacityKwp);
  const annualKwhLoss = getAnnualKwhLoss(dcLossStcKw, annualPoaIrradiance, performanceRatio);
  const annualDollarLoss = getAnnualDollarLoss(annualKwhLoss, ppaRate);

  return {
    lossFactor,
    pOperatingW,
    dcLossInstantKw,
    dcLossStcKw,
    dcLossPct,
    annualKwhLoss,
    annualDollarLoss,
    // Aliases
    dcLossKw: dcLossInstantKw,
    annKwh: annualKwhLoss,
    annDollar: annualDollarLoss,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-report validation
// ─────────────────────────────────────────────────────────────────────────────
interface ValidationInput {
  irradianceWm2: number;
  moduleTempC: number;
  tempCoeffPmax: number;
  plantCapacityKwp: number;
  ppaRate: number;
  annualPoaIrradiance: number;
  performanceRatio: number;
  anomalyCount: number;
  minModulesAffected: number;
  totalDcPct: number;
}

export function validateBeforeReport(v: ValidationInput): Array<{ blocking: boolean; message: string }> {
  const errors: Array<{ blocking: boolean; message: string }> = [];

  if (v.irradianceWm2 < 600) {
    errors.push({ blocking: true, message: `Irradiance ${v.irradianceWm2} W/m² is below IEC 62446-3 minimum of 600 W/m².` });
  }
  if (v.moduleTempC <= 0) {
    errors.push({ blocking: true, message: "Module temperature not recorded. Required for IEC 60891 correction." });
  }
  if (v.plantCapacityKwp <= 0) {
    errors.push({ blocking: true, message: "Plant capacity (kWp) must be greater than 0." });
  }
  if (v.ppaRate <= 0) {
    errors.push({ blocking: false, message: "PPA rate is 0 — financial loss figures will be zero." });
  }
  if (v.annualPoaIrradiance < 800) {
    errors.push({ blocking: false, message: `Annual POA irradiance ${v.annualPoaIrradiance} kWh/m²/yr is unusually low.` });
  }
  if (v.anomalyCount === 0) {
    errors.push({ blocking: true, message: "No anomalies recorded. Cannot generate a report." });
  }
  if (v.totalDcPct > 100) {
    errors.push({ blocking: true, message: `Total DC loss exceeds 100% (${v.totalDcPct.toFixed(1)}%). Verify module counts.` });
  }

  return errors;
}
