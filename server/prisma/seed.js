// ===========================================
// Database Seed Script
// Seeds default departments and admin user
// Run: npm run db:seed
// ===========================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaultDepartments = [
  { 
    name: 'Water Supply', 
    description: 'Water supply, pipelines, and drainage issues', 
    aiLabel: 'Water',
    keywords: 'water, leak, pipe, pipe burst, tap, valve, pump, reservoir, tank, canal, drainage, sewer, flooding, moisture, wet'
  },
  { 
    name: 'Electricity Board', 
    description: 'Electrical infrastructure, streetlights, and power supply', 
    aiLabel: 'Electricity',
    keywords: 'electricity, power, light, streetlight, cable, wire, transformer, pole, spark, blackout, meter, current, high voltage'
  },
  { 
    name: 'Sanitation Department', 
    description: 'Waste management, cleaning, and sanitation issues', 
    aiLabel: 'Sanitation',
    keywords: 'garbage, waste, trash, bin, litter, sweep, dustbin, landfill, foul smell, septic, public toilet, hygiene, cleaning'
  },
  { 
    name: 'Roads & Infrastructure', 
    description: 'Road maintenance, potholes, and construction', 
    aiLabel: 'Roads',
    keywords: 'road, highway, street, lane, roadway, expressway, freeway, asphalt, pavement, concrete road, gravel road, lane markings, divider, median, shoulder, zebra crossing, pedestrian crossing, speed breaker, curb, sidewalk, footpath, traffic signal, traffic light, stop sign, signboard, road sign, direction sign, toll booth, checkpoint, bridge, flyover, overpass, underpass, tunnel, culvert, retaining wall, drainage system, road construction, road work, excavation, barricade, construction equipment, crane, asphalt laying, repair work, pothole, resurfacing, urban road, rural road, city street, intersection, junction, roundabout, roadside buildings, street lights, damaged road, potholes, wet road, flooded road, dusty road, night road, empty road, heavy traffic, low visibility, infrastructure damage, smart city, highway infrastructure, transport network, road safety, construction zone'
  },
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
      await prisma.department.update({
        where: { id: existing.id },
        data: { keywords: dept.keywords }
      });
      console.log(`   🔄 Department updated (keywords): ${dept.name}`);
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
