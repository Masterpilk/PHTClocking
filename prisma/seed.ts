import { PrismaClient, Direction, Role, Method, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // create zones
  const zones = ['Stage', 'FOH', 'Fly Floor', 'Dressing Rm 1'];
  for (const z of zones) {
    await prisma.zone.upsert({ where: { name: z }, update: {}, create: { name: z } });
  }

  // create people
  const peopleData = [
    { displayName: 'Alice', firstName: 'Alice', lastName: 'A', role: Role.Cast },
    { displayName: 'Bob', firstName: 'Bob', lastName: 'B', role: Role.Crew },
    { displayName: 'Charlie', firstName: 'Charlie', lastName: 'C', role: Role.Tech },
    { displayName: 'Dana', firstName: 'Dana', lastName: 'D', role: Role.FOH },
    { displayName: 'Eve', firstName: 'Eve', lastName: 'E', role: Role.Musician }
  ];
  for (const p of peopleData) {
    await prisma.person.upsert({
      where: { displayName: p.displayName },
      update: {},
      create: { ...p }
    });
  }

  // create user admin
  const adminPassword = await bcrypt.hash('adminpass', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: UserRole.Admin,
      displayName: 'Admin'
    }
  });

  // create check events over last 12 hours
  const now = new Date();
  const zone = await prisma.zone.findFirst();
  const people = await prisma.person.findMany();
  for (const person of people) {
    for (let i = 0; i < 3; i++) {
      const ts = new Date(now.getTime() - (i + 1) * 4 * 60 * 60 * 1000); // every 4 hours
      await prisma.checkEvent.create({
        data: {
          personId: person.id,
          direction: i % 2 === 0 ? Direction.IN : Direction.OUT,
          timestamp: ts,
          zoneId: zone?.id,
          method: Method.ADMIN
        }
      });
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
