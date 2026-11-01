import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("E+m.c2+enerji", 10);

  // Standart Abonelik Planları
  await prisma.plan.upsert({
    where: { name: "Basic" },
    update: {},
    create: { name: "Basic", priceMonthly: 29, maxUsers: 5, maxTables: 15 },
  });
  await prisma.plan.upsert({
    where: { name: "Pro" },
    update: {},
    create: { name: "Pro", priceMonthly: 59, maxUsers: 20, maxTables: 60 },
  });

  // Tek Super Admin Hesabı
  await prisma.user.upsert({
    where: { email: "besiralkya@gmail.com" },
    update: { passwordHash: hash },
    create: {
      email: "besiralkya@gmail.com",
      name: "Bešir Alkaya",
      passwordHash: hash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Database seeded: Only Super Admin and Plans exist. No tenants.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
