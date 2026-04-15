const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("--- NEXPWR SEEDER STARTING ---");
  console.log("Step 1: Connecting to database...");

  const clientEmail = "owner@alpha-solar.com";
  
  console.log("Step 2: Checking for existing client: " + clientEmail);
  const existingClient = await prisma.client.findUnique({ where: { email: clientEmail } });
  
  if (existingClient) {
    console.log("Step 3: Cleaning up existing Alpha Solar data (ID: " + existingClient.id + ")...");
    await prisma.client.delete({ where: { id: existingClient.id } });
    console.log("Cleanup complete.");
  } else {
    console.log("Step 3: No existing data found. Proceeding to fresh creation.");
  }

  // 2. Create Client Organization
  console.log("Step 4: Creating Client Organization...");
  const client = await prisma.client.create({
    data: {
      name: "Alpha Solar Assets",
      company: "Alpha Renewables Group",
      email: clientEmail,
      phone: "+91 98765 43210",
      address: "Sector 44, Gurgaon, India",
      plan: "Enterprise",
      isActive: true,
    },
  });

  // 3. Create Client User
  const hashedPassword = await bcrypt.hash("nexpwr123", 10);
  await prisma.user.create({
    data: {
      email: "user@alpha-solar.com",
      name: "Portfolio Manager",
      passwordHash: hashedPassword,
      role: "CLIENT",
      clientId: client.id,
    },
  });

  // 4. Create Sites
  const siteAlpha = await prisma.site.create({
    data: {
      clientId: client.id,
      name: "Rajasthan Solar Park",
      location: "Jodhpur, RJ",
      capacityMw: 250.0,
      capacityAcMw: 210.0,
      commissioningDate: new Date("2021-06-15"),
      moduleManufacturer: "Trina Solar",
      moduleModel: "Vertex 500W",
      isActive: true,
    },
  });

  const siteBeta = await prisma.site.create({
    data: {
      clientId: client.id,
      name: "Gujarat Blue Sky",
      location: "Kutch, GJ",
      capacityMw: 180.0,
      capacityAcMw: 155.0,
      commissioningDate: new Date("2022-03-10"),
      moduleManufacturer: "Jinko Solar",
      moduleModel: "Tiger Pro",
      isActive: true,
    },
  });

  // 5. Generate 6 Months of Monthly Inspections (Oct 2025 - Mar 2026)
  const months = [
    { name: "Oct", date: new Date("2025-10-15") },
    { name: "Nov", date: new Date("2025-11-15") },
    { name: "Dec", date: new Date("2025-12-15") },
    { name: "Jan", date: new Date("2026-01-15") },
    { name: "Feb", date: new Date("2026-02-15") },
    { name: "Mar", date: new Date("2026-03-15") },
  ];

  const types = ["Hotspot", "Diode Failure", "String Outage", "Cell Anomaly", "Soiling", "PID"];
  const iecClasses = ["Class 1", "Class 2", "Class 3", "Class 4"];
  const colors = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-red-500"];

  for (const month of months) {
    for (const site of [siteAlpha, siteBeta]) {
      // Create Inspection
      const inspection = await prisma.inspection.create({
        data: {
          clientId: client.id,
          siteId: site.id,
          date: month.date,
          status: "PUBLISHED",
          operator: "NexPwr Drone Team",
          irradianceWm2: 850,
          ambientTempC: 32,
        },
      });

      // Randomized Metrics per inspection
      const anomalyCount = Math.floor(Math.random() * 50) + 20;
      const powerLoss = (Math.random() * 50) + 10;
      const revenueLoss = powerLoss * 4.5 * 365; // Approx ₹4.5 per unit

      const metric = await prisma.siteMetric.create({
        data: {
          siteId: site.id,
          inspectionId: inspection.id,
          totalPowerLossKwp: powerLoss,
          totalRevenueLoss: revenueLoss,
          totalAnomalyCount: anomalyCount,
          criticalCount: Math.floor(anomalyCount * 0.15),
          moderateCount: Math.floor(anomalyCount * 0.35),
          minorCount: Math.floor(anomalyCount * 0.50),
          iecClassA: Math.floor(anomalyCount * 0.2), // Derived from actual class mappings
          iecClassB: Math.floor(anomalyCount * 0.3),
          iecClassC: Math.floor(anomalyCount * 0.4),
          iecClassD: Math.floor(anomalyCount * 0.1),
        },
      });

      // Create a handful of individual annotations for the breakdown pie chart
      for (const type of types) {
        const typeCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < typeCount; i++) {
          await prisma.annotation.create({
            data: {
              clientId: client.id,
              siteId: site.id,
              inspectionId: inspection.id,
              type: type,
              iecClass: iecClasses[Math.floor(Math.random() * 4)],
              deltaT: (Math.random() * 25) + 3,
              tAnomaly: (Math.random() * 10) + 50,
              tReference: 35,
              status: "OPEN",
              modulesAffected: 1,
              lossResults: {
                specificPowerLossKwp: (Math.random() * 0.5) + 0.1,
                annualRevenueLoss: (Math.random() * 500) + 100,
              }
            }
          });
        }
      }
    }
  }

  console.log("Seed finished successfully!");
  console.log("Credentials:");
  console.log("Email: user@alpha-solar.com");
  console.log("Password: nexpwr123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
