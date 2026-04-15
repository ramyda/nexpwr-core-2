const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSecurityTest() {
  console.log("🚀 Starting Client Security & Data Integrity Verification...\n");

  try {
    // 1. Setup Test Client
    console.log("📝 Creating Test Client...");
    const testClient = await prisma.client.create({
      data: {
        name: "QA Security Test Org",
        company: "QA Labs Inc",
        email: `qa-test-${Date.now()}@example.com`,
        isActive: true,
      }
    });
    console.log(`✅ Client created: ${testClient.id}`);

    // 2. Setup Nested Data (Sites & Inspections)
    console.log("📝 Creating Nested Data (Site & Inspection)...");
    const testSite = await prisma.site.create({
      data: {
        clientId: testClient.id,
        name: "Security Boundary Site",
        location: "Test Range A",
        capacityMw: 5.0,
      }
    });

    const testInspection = await prisma.inspection.create({
      data: {
        siteId: testSite.id,
        clientId: testClient.id,
        date: new Date(),
        status: "DRAFT",
      }
    });
    console.log("✅ Nested hierarchy established.\n");

    // 3. Verify Suspend Logic
    console.log("🛡️ Testing Suspend Logic...");
    await prisma.client.update({
      where: { id: testClient.id },
      data: { isActive: false }
    });
    
    const suspendedCheck = await prisma.client.findUnique({
      where: { id: testClient.id },
      select: { isActive: true }
    });
    
    if (suspendedCheck.isActive === false) {
      console.log("✅ Suspend status confirmed in DB.");
    } else {
      throw new Error("❌ FAIL: Suspend status not updated correctly.");
    }

    // 4. Verify Delete Cascade
    console.log("\n🧨 Testing Delete Cascade...");
    await prisma.client.delete({
      where: { id: testClient.id }
    });
    console.log("✅ Client record deleted.");

    const siteCheck = await prisma.site.findUnique({ where: { id: testSite.id } });
    const inspectionCheck = await prisma.inspection.findUnique({ where: { id: testInspection.id } });

    if (!siteCheck && !inspectionCheck) {
      console.log("✅ CASCADE SUCCESS: Nested Site and Inspection records were completely wiped.");
    } else {
      if (siteCheck) console.error("❌ FAIL: Site record still exists!");
      if (inspectionCheck) console.error("❌ FAIL: Inspection record still exists!");
      throw new Error("❌ CASCADE FAIL: Data remnants detected.");
    }

    console.log("\n✨ ALL SECURITY TESTS PASSED SUCCESSFULLY! ✨");

  } catch (error) {
    console.error("\n❌ SECURITY TEST FAILED:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityTest();
