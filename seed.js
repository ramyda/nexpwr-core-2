const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@nexpwr.com' },
    update: { passwordHash: hash, role: 'ADMIN', name: 'System Admin' },
    create: {
      email: 'admin@nexpwr.com',
      passwordHash: hash,
      role: 'ADMIN',
      name: 'System Admin'
    }
  })
  console.log("✅ User seeded:", user.email, "| role:", user.role)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => {
  prisma.$disconnect()
})
