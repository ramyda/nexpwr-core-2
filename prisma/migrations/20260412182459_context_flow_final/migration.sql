-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacityMw" DOUBLE PRECISION NOT NULL,
    "modules" INTEGER,
    "inverter" TEXT,
    "mountType" TEXT,
    "ppaRate" DOUBLE PRECISION,
    "performanceRatio" DOUBLE PRECISION,
    "moduleMakeModel" TEXT,
    "moduleManufacturer" TEXT,
    "moduleModel" TEXT,
    "moduleStcPower" DOUBLE PRECISION,
    "moduleTech" TEXT,
    "tempCoeffPmax" DOUBLE PRECISION,
    "noct" DOUBLE PRECISION,
    "modulesPerString" INTEGER,
    "annualPoa" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "commissioningDate" TIMESTAMP(3),
    "siteOwner" TEXT,
    "omContractor" TEXT,
    "gridConnectionType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "capacityAcMw" DOUBLE PRECISION,
    "inverterCount" INTEGER,
    "stringCount" INTEGER,
    "combinerBoxCount" INTEGER,
    "cellCount" INTEGER,
    "moduleEfficiency" DOUBLE PRECISION,
    "moduleLength" DOUBLE PRECISION,
    "moduleWidth" DOUBLE PRECISION,
    "moduleHeight" DOUBLE PRECISION,
    "moduleWeight" DOUBLE PRECISION,
    "tempCoeffIsc" DOUBLE PRECISION,
    "tempCoeffVoc" DOUBLE PRECISION,
    "bifacialityFactor" DOUBLE PRECISION,
    "panFileUrl" TEXT,
    "inverterManufacturer" TEXT,
    "inverterModel" TEXT,
    "inverterType" TEXT,
    "inverterRatedPowerAc" DOUBLE PRECISION,
    "mpptCount" INTEGER,
    "maxDcInputVoltage" DOUBLE PRECISION,
    "mpptVoltageMin" DOUBLE PRECISION,
    "mpptVoltageMax" DOUBLE PRECISION,
    "ratedAcOutputVoltage" DOUBLE PRECISION,
    "inverterEfficiency" DOUBLE PRECISION,
    "communicationProtocol" TEXT,
    "tiltAngle" DOUBLE PRECISION,
    "azimuthAngle" DOUBLE PRECISION,
    "trackerMakeModel" TEXT,
    "rowSpacing" DOUBLE PRECISION,
    "dcCableSection" DOUBLE PRECISION,
    "acCableSection" DOUBLE PRECISION,
    "earthingSystem" TEXT,
    "lightningProtection" BOOLEAN NOT NULL DEFAULT false,
    "surgeProtection" BOOLEAN NOT NULL DEFAULT false,
    "availabilityTarget" DOUBLE PRECISION,
    "degradationRate" DOUBLE PRECISION,
    "ppaTerm" INTEGER,
    "fitRate" DOUBLE PRECISION,
    "minIrradianceThermography" DOUBLE PRECISION DEFAULT 600,
    "minDeltaTThreshold" DOUBLE PRECISION DEFAULT 3,
    "cameraEmissivity" DOUBLE PRECISION DEFAULT 0.85,
    "preInspectionRunDuration" INTEGER DEFAULT 60,
    "thermalCameraModel" TEXT,
    "dronePlatform" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "clientId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "operator" TEXT,
    "droneModel" TEXT,
    "thermalSensor" TEXT,
    "ambientTempC" DOUBLE PRECISION,
    "humidityPercent" DOUBLE PRECISION,
    "windSpeedMs" DOUBLE PRECISION,
    "cloudCover" DOUBLE PRECISION,
    "irradianceWm2" DOUBLE PRECISION,
    "moduleTempC" DOUBLE PRECISION,
    "emissivity" DOUBLE PRECISION,
    "deltaTThreshold" DOUBLE PRECISION,
    "annualPoa" DOUBLE PRECISION,
    "ppaRate" DOUBLE PRECISION,
    "thermalFilePath" TEXT,
    "visualFilePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "clientId" TEXT,
    "siteId" TEXT,
    "type" TEXT NOT NULL,
    "iecClass" TEXT NOT NULL,
    "deltaT" DOUBLE PRECISION NOT NULL,
    "tAnomaly" DOUBLE PRECISION NOT NULL,
    "tReference" DOUBLE PRECISION NOT NULL,
    "locationString" TEXT,
    "priority" TEXT,
    "modulesAffected" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "polygonPoints" JSONB,
    "pixelCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "clientId" TEXT,
    "siteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "pdfUrl" TEXT,
    "csvUrl" TEXT,
    "kmlUrl" TEXT,
    "mapPngUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishedToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
