/**
 * NexPwr Calculation Engine
 *
 * Implements IEC 60891 temperature-corrected power loss estimation and
 * IEC 62446-3 ΔT-based severity classification.
 *
 * DISCLAIMER: Power loss values are estimated using manufacturer STC ratings
 * corrected for measured module temperature per IEC 60891 (simplified procedure).
 * Loss factors are engineering estimates based on industry practice and are NOT
 * defined by any IEC standard. Definitive power loss quantification requires
 * I-V curve tracing per IEC 60891.
 */

import prisma from "@/lib/prisma";
import { LOSS_FACTORS, getSeverityFromDelta, SeverityType } from "@/lib/constants";

export interface LossResult {
  specificPowerLossKwp: number;
  annualRevenueLoss: number;
  lossFactor: number;
  severityLabel: SeverityType;
  // IEC 60891 intermediate values
  correctionFactor: number;
  correctedModulePowerW: number;
}

interface AnnotationInput {
  type: string;
  deltaT: number;
  tAnomaly: number;
  tReference: number;
  modulesAffected: number;
}

interface SiteParams {
  moduleStcPower: number;   // Wp — STC rated power per module
  tempCoeffPmax: number;    // %/°C e.g. -0.35
  annualPoa: number;        // kWh/m²/year for annual projection
  performanceRatio: number; // 0-1 dimensionless
  ppaRate: number;          // $/kWh or ₹/kWh
  moduleTempC?: number;     // Module backsheet temp at time of inspection
}

/**
 * Calculates the power loss for a single annotated anomaly.
 *
 * Formula (IEC 60891 simplified single-coefficient):
 *   Correction Factor = 1 + (tempCoeffPmax / 100) × (T_module - 25)
 *   Corrected Power = STC_Power × Correction Factor
 *   Power Loss (kWp) = modulesAffected × (Corrected Power / 1000) × lossFactor
 *   Annual Revenue Loss = Power Loss × annualPoa × performanceRatio × ppaRate
 */
export function calculateAnnotationLoss(
  annotation: AnnotationInput,
  site: SiteParams
): LossResult {
  const lossFactor = LOSS_FACTORS[annotation.type] ?? 0.1;
  const severityLabel = getSeverityFromDelta(annotation.deltaT);

  // IEC 60891 temperature correction
  const moduleTempC = site.moduleTempC ?? 55; // default 55°C if not recorded
  const correctionFactor = 1 + (site.tempCoeffPmax / 100) * (moduleTempC - 25);
  const correctedModulePowerW = site.moduleStcPower * correctionFactor;

  // Specific Power Loss in kWp
  const specificPowerLossKwp =
    annotation.modulesAffected * (correctedModulePowerW / 1000) * lossFactor;

  // Annual revenue loss
  const annualRevenueLoss =
    specificPowerLossKwp * site.annualPoa * site.performanceRatio * site.ppaRate;

  return {
    specificPowerLossKwp: Math.max(0, specificPowerLossKwp),
    annualRevenueLoss: Math.max(0, annualRevenueLoss),
    lossFactor,
    severityLabel,
    correctionFactor,
    correctedModulePowerW,
  };
}

/**
 * Maps IEC ΔT-based severity to IEC CoA class bucket (A/B/C/D).
 *   Class A: ΔT ≥ 20°C (critical)
 *   Class B: 10°C ≤ ΔT < 20°C (moderate)
 *   Class C: 3°C ≤ ΔT < 10°C (minor)
 *   Class D: ΔT < 3°C (not significant)
 */
export function getIecCoaClass(deltaT: number): "A" | "B" | "C" | "D" {
  if (deltaT >= 20) return "A";
  if (deltaT >= 10) return "B";
  if (deltaT >= 3) return "C";
  return "D";
}

/**
 * Runs the full calculation pipeline for an inspection:
 * 1. Loads all annotations with their site/inspection metadata
 * 2. Calculates loss for each annotation and persists lossResults
 * 3. Rolls up aggregates into a SiteMetric upsert
 * 4. Updates Inspection.status → "CALCULATED"
 */
export async function runCalculationForInspection(inspectionId: string): Promise<void> {
  try {
    // Load the inspection with all related data in one query
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        site: {
          select: {
            id: true,
            moduleStcPower: true,
            tempCoeffPmax: true,
            annualPoa: true,
            performanceRatio: true,
            ppaRate: true,
          },
        },
        annotations: true,
      },
    });

    if (!inspection || !inspection.site) return;

    const site = inspection.site;

    // Build site params with fallbacks from inspection
    const siteParams: SiteParams = {
      moduleStcPower: site.moduleStcPower ?? 550,      // Default 550W module
      tempCoeffPmax: site.tempCoeffPmax ?? -0.35,       // Default silicon coefficient
      annualPoa: site.annualPoa ?? inspection.annualPoa ?? 1600,
      performanceRatio: site.performanceRatio ?? 0.80,
      ppaRate: site.ppaRate ?? inspection.ppaRate ?? 3.5, // ₹3.5/kWh default
      moduleTempC: inspection.moduleTempC ?? undefined,
    };

    // --- Rollup counters ---
    let totalPowerLossKwp = 0;
    let totalRevenueLoss = 0;
    let criticalCount = 0, moderateCount = 0, minorCount = 0, notSignificantCount = 0;
    let pendingCount = 0, resolvedCount = 0, inProgressCount = 0,
        falsePositiveCount = 0, notFoundCount = 0;
    let iecClassA = 0, iecClassB = 0, iecClassC = 0, iecClassD = 0;

    // --- Process each annotation ---
    const annotationUpdates = inspection.annotations.map(async (annotation) => {
      const result = calculateAnnotationLoss(
        {
          type: annotation.type,
          deltaT: annotation.deltaT,
          tAnomaly: annotation.tAnomaly,
          tReference: annotation.tReference,
          modulesAffected: annotation.modulesAffected,
        },
        siteParams
      );

      // Accumulate rollup totals
      totalPowerLossKwp += result.specificPowerLossKwp;
      totalRevenueLoss += result.annualRevenueLoss;

      // Severity counts
      switch (result.severityLabel) {
        case "critical":         criticalCount++;       break;
        case "moderate":         moderateCount++;       break;
        case "minor":            minorCount++;          break;
        case "not_significant":  notSignificantCount++; break;
      }

      // Status counts
      const status = annotation.status.toUpperCase();
      if (status === "OPEN" || status === "PENDING") pendingCount++;
      else if (status === "RESOLVED")                 resolvedCount++;
      else if (status === "IN_PROGRESS")              inProgressCount++;
      else if (status === "FALSE_POSITIVE")           falsePositiveCount++;
      else if (status === "NOT_FOUND")                notFoundCount++;

      // IEC CoA class counts
      const iecClass = getIecCoaClass(annotation.deltaT);
      if (iecClass === "A") iecClassA++;
      else if (iecClass === "B") iecClassB++;
      else if (iecClass === "C") iecClassC++;
      else if (iecClass === "D") iecClassD++;

      // Persist lossResults to the annotation
      return prisma.annotation.update({
        where: { id: annotation.id },
        data: {
          lossResults: result as any,
          calculatedAt: new Date(),
        },
      });
    });

    await Promise.all(annotationUpdates);

    const totalAnomalyCount = inspection.annotations.length;

    // --- Upsert SiteMetric ---
    await prisma.siteMetric.upsert({
      where: {
        siteId_inspectionId: {
          siteId: site.id,
          inspectionId: inspection.id,
        },
      },
      create: {
        siteId: site.id,
        inspectionId: inspection.id,
        totalPowerLossKwp,
        totalRevenueLoss,
        totalAnomalyCount,
        criticalCount,
        moderateCount,
        minorCount,
        notSignificantCount,
        pendingCount,
        resolvedCount,
        inProgressCount,
        falsePositiveCount,
        notFoundCount,
        iecClassA,
        iecClassB,
        iecClassC,
        iecClassD,
        calculatedAt: new Date(),
      },
      update: {
        totalPowerLossKwp,
        totalRevenueLoss,
        totalAnomalyCount,
        criticalCount,
        moderateCount,
        minorCount,
        notSignificantCount,
        pendingCount,
        resolvedCount,
        inProgressCount,
        falsePositiveCount,
        notFoundCount,
        iecClassA,
        iecClassB,
        iecClassC,
        iecClassD,
        calculatedAt: new Date(),
      },
    });

    // --- Update inspection status ---
    if (inspection.status !== "PUBLISHED") {
      await prisma.inspection.update({
        where: { id: inspectionId },
        data: { status: "CALCULATED" },
      });
    }
  } catch (err) {
    // Non-blocking — log but do not throw so the API response is not affected
    console.error("[CalculationEngine] Failed for inspection", inspectionId, err);
  }
}
