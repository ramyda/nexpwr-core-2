const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.update({
    where: { email: "client@test.com" },
    data: { passwordHash }
  });
  console.log("Updated password for client@test.com to password123");
}
main().finally(() => prisma.$disconnect());
