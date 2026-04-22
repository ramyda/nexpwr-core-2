import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient();
  const client = await prisma.client.findFirst();
  
  if (!client) {
    console.error("No client found in database. Create a client first.");
    process.exit(1);
  }

  const email = "client@test.com";
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "CLIENT",
      clientId: client.id,
    },
    create: {
      email,
      passwordHash,
      role: "CLIENT",
      clientId: client.id,
      name: "Test Client User",
    },
  });

  console.log(`Successfully created/updated client user:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Associated with Client: ${client.name} (${client.id})`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
