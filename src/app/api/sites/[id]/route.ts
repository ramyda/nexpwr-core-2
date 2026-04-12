import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        client: true,
        inspections: {
          include: {
            _count: {
              select: { anomalies: true }
            }
          },
          orderBy: { date: 'desc' }
        },
        // We will fetch anomalies and reports separately if needed, 
        // but for now let's get them for the tabs
      }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get all anomalies across all inspections
    const allAnomalies = await prisma.anomaly.findMany({
      where: {
        inspection: {
          siteId: id
        }
      },
      include: {
        inspection: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all reports across all inspections
    const allReports = await prisma.report.findMany({
      where: {
        inspection: {
          siteId: id
        }
      },
      include: {
        inspection: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      ...site,
      allAnomalies,
      allReports
    });
  } catch (error) {
    console.error('Error fetching site details:', error);
    return NextResponse.json({ error: "Failed to fetch site details" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const {
      name, location, capacityMw, modules, inverter, mountType,
      ppaRate, performanceRatio, moduleManufacturer, moduleModel,
      moduleStcPower, moduleTech, tempCoeffPmax, noct, modulesPerString,
      annualPoa, latitude, longitude, commissioningDate, siteOwner,
      omContractor, gridConnectionType, currency, capacityAcMw,
      inverterCount, stringCount, combinerBoxCount, cellCount,
      moduleEfficiency, moduleLength, moduleWidth, moduleHeight,
      moduleWeight, tempCoeffIsc, tempCoeffVoc, bifacialityFactor,
      inverterManufacturer, inverterModel, inverterType, inverterRatedPowerAc,
      mpptCount, maxDcInputVoltage, mpptVoltageMin, mpptVoltageMax,
      ratedAcOutputVoltage, inverterEfficiency, communicationProtocol,
      tiltAngle, azimuthAngle, trackerMakeModel, rowSpacing,
      dcCableSection, acCableSection, earthingSystem, lightningProtection,
      surgeProtection, availabilityTarget, degradationRate, ppaTerm, fitRate,
      minIrradianceThermography, minDeltaTThreshold, cameraEmissivity,
      preInspectionRunDuration, thermalCameraModel, dronePlatform
    } = await req.json();

    const site = await prisma.site.update({
      where: { id },
      data: {
        name, location, capacityMw, modules, inverter, mountType,
        ppaRate, performanceRatio, moduleManufacturer, moduleModel,
        moduleStcPower, moduleTech, tempCoeffPmax, noct, modulesPerString,
        annualPoa, latitude, longitude,
        commissioningDate: commissioningDate ? new Date(commissioningDate) : undefined,
        siteOwner, omContractor, gridConnectionType, currency,
        capacityAcMw, inverterCount, stringCount, combinerBoxCount,
        cellCount, moduleEfficiency, moduleLength, moduleWidth,
        moduleHeight, moduleWeight, tempCoeffIsc, tempCoeffVoc,
        bifacialityFactor, inverterManufacturer, inverterModel,
        inverterType, inverterRatedPowerAc, mpptCount, maxDcInputVoltage,
        mpptVoltageMin, mpptVoltageMax, ratedAcOutputVoltage,
        inverterEfficiency, communicationProtocol, tiltAngle,
        azimuthAngle, trackerMakeModel, rowSpacing, dcCableSection,
        acCableSection, earthingSystem, lightningProtection,
        surgeProtection, availabilityTarget, degradationRate,
        ppaTerm, fitRate, minIrradianceThermography, minDeltaTThreshold,
        cameraEmissivity, preInspectionRunDuration, thermalCameraModel,
        dronePlatform
      },
    });
    return NextResponse.json(site);
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}
