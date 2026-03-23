// ===========================================
// Database Seed Script
// Seeds default departments and admin user
// Run: npm run db:seed
// ===========================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaultDepartments = [
  { name: 'Water Supply', description: 'Water supply, pipelines, and drainage issues', aiLabel: 'Water' },
  { name: 'Electricity Board', description: 'Electrical infrastructure, streetlights, and power supply', aiLabel: 'Electricity' },
  { name: 'Sanitation Department', description: 'Waste management, cleaning, and sanitation issues', aiLabel: 'Sanitation' },
  { name: 'Roads & Infrastructure', description: 'Road maintenance, potholes, and construction', aiLabel: 'Roads' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed departments
  for (const dept of defaultDepartments) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!existing) {
      await prisma.department.create({ data: dept });
      console.log(`   ✅ Department created: ${dept.name}`);
    } else {
      console.log(`   ⏭️  Department exists: ${dept.name}`);
    }
  }

  // Seed admin user
  const adminEmail = 'admin@municipal.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    console.log(`   ✅ Admin user created: ${adminEmail} (password: admin123)`);
  } else {
    console.log(`   ⏭️  Admin user exists: ${adminEmail}`);
  }

  console.log('\n✅ Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
