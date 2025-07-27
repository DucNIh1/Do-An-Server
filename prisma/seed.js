const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedAdvisorPassword = await bcrypt.hash('advisor123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'advisor@example.com' },
    update: {},
    create: {
      email: 'advisor@example.com',
      name: 'Advisor User',
      password: hashedAdvisorPassword,
      role: 'ADVISOR',
    },
  });

  console.log('✅ Seeded users: Admin and Advisor');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });