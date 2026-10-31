import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  const basic = await prisma.plan.upsert({
    where: { name: "Basic" },
    update: {},
    create: { name: "Basic", priceMonthly: 29, maxUsers: 5, maxTables: 15 },
  });
  await prisma.plan.upsert({
    where: { name: "Pro" },
    update: {},
    create: { name: "Pro", priceMonthly: 59, maxUsers: 20, maxTables: 60 },
  });

  await prisma.user.upsert({
    where: { email: "owner@platform.com" },
    update: {},
    create: { email: "owner@platform.com", name: "Platform Owner", passwordHash: hash, role: "SUPER_ADMIN" },
  });

  const caky = await prisma.tenant.upsert({
    where: { slug: "caky-bar" },
    update: {},
    create: {
      slug: "caky-bar",
      name: "CAKY BAR",
      planId: basic.id,
      paymentStatus: "PAID",
      subscriptionEndsAt: new Date(Date.now() + 30 * 864e5),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@caky.com" },
    update: {},
    create: { email: "admin@caky.com", name: "Caky Admin", passwordHash: hash, role: "ADMIN", tenantId: caky.id },
  });
  await prisma.user.upsert({
    where: { email: "radnik@caky.com" },
    update: {},
    create: { email: "radnik@caky.com", name: "Marko Konobar", passwordHash: hash, role: "RADNIK", tenantId: caky.id },
  });

  for (let n = 1; n <= 8; n++) {
    await prisma.table.upsert({
      where: { tenantId_number: { tenantId: caky.id, number: n } },
      update: {},
      create: { tenantId: caky.id, number: n, name: n <= 4 ? `Unutra ${n}` : `Bašta ${n - 4}` },
    });
  }

  // Kategoriler ve başlangıç ürünleri
  const catNames = [
    { name: "Kafe & Topli napici", sortOrder: 1 },
    { name: "Kokteli & Pivo", sortOrder: 2 },
    { name: "Kuhinja & Burgeri", sortOrder: 3 },
    { name: "Bezalkoholna pića", sortOrder: 4 },
  ];

  const catMap: Record<string, string> = {};
  for (const c of catNames) {
    const rec = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: caky.id, name: c.name } },
      update: { sortOrder: c.sortOrder },
      create: { tenantId: caky.id, name: c.name, sortOrder: c.sortOrder },
    });
    catMap[c.name] = rec.id;
  }

  const supCount = await prisma.supplier.count({ where: { tenantId: caky.id } });
  if (supCount === 0) {
    const sup1 = await prisma.supplier.create({
      data: {
        tenantId: caky.id,
        name: "Coca-Cola HBC",
        contactPerson: "Nikola Jovanović",
        phone: "+387 65 221 330",
        email: "narudzbe@cchbc.com",
        address: "Industrijska zona bb",
        notes: "Isporuka utorkom i petkom do 11:00h",
      },
    });
    const sup2 = await prisma.supplier.create({
      data: {
        tenantId: caky.id,
        name: "Diskont Pića & Kafe Adria",
        contactPerson: "Milan Petrović",
        phone: "+387 66 882 119",
        email: "info@adriadiskont.com",
        address: "Bulevar oslobođenja 42",
        notes: "Kafa, pivo i žestoka pića – rabat 5% na avans",
      },
    });
    await prisma.product.updateMany({
      where: { tenantId: caky.id, name: { contains: "Coca-Cola" } },
      data: { supplierId: sup1.id },
    });
    await prisma.product.updateMany({
      where: { tenantId: caky.id, supplierId: null },
      data: { supplierId: sup2.id },
    });
  }

  const existingProducts = await prisma.product.count({ where: { tenantId: caky.id } });
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: [
        {
          tenantId: caky.id,
          categoryId: catMap["Kafe & Topli napici"],
          name: "Cappuccino Grande",
          unit: "šolja",
          currentQuantity: 120,
          minQuantity: 25,
          optimalQuantity: 150,
          costPrice: 0.65,
          sellingPrice: 2.8,
          imageUrl: "/hero-dish.jpg",
          description: "100% Arabica espresso sa svježom kremastom pjenom",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Kafe & Topli napici"],
          name: "Domaći Espresso",
          unit: "šolja",
          currentQuantity: 200,
          minQuantity: 40,
          optimalQuantity: 250,
          costPrice: 0.45,
          sellingPrice: 2.0,
          imageUrl: "/hero-dish.jpg",
          description: "Intenzivan italijanski blend",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Kuhinja & Burgeri"],
          name: "Gourmet Cheeseburger",
          unit: "porcija",
          currentQuantity: 35,
          minQuantity: 10,
          optimalQuantity: 50,
          costPrice: 3.4,
          sellingPrice: 8.5,
          imageUrl: "/hero-burger.jpg",
          description: "100% junetina, cheddar sir, karamelizovani luk, brioš",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Kuhinja & Burgeri"],
          name: "Truffle Tagliatelle",
          unit: "porcija",
          currentQuantity: 22,
          minQuantity: 8,
          optimalQuantity: 40,
          costPrice: 3.8,
          sellingPrice: 9.9,
          imageUrl: "/hero-pasta.jpg",
          description: "Domaća tjestenina u krem sosu od crnih tartufa",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Kokteli & Pivo"],
          name: "Old Fashioned Koktel",
          unit: "čaša",
          currentQuantity: 45,
          minQuantity: 10,
          optimalQuantity: 60,
          costPrice: 2.1,
          sellingPrice: 6.5,
          imageUrl: "/hero-cocktail.jpg",
          description: "Bourbon, angostura biter, kora narandže",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Kokteli & Pivo"],
          name: "Heineken 0.33L",
          unit: "boca",
          currentQuantity: 18,
          minQuantity: 24,
          optimalQuantity: 96,
          costPrice: 1.2,
          sellingPrice: 3.2,
          description: "Svijetlo lager pivo",
        },
        {
          tenantId: caky.id,
          categoryId: catMap["Bezalkoholna pića"],
          name: "Coca-Cola 0.25L",
          unit: "boca",
          currentQuantity: 14,
          minQuantity: 24,
          optimalQuantity: 96,
          costPrice: 0.85,
          sellingPrice: 2.5,
          description: "Staklena flašica",
        },
      ],
    });
  }

  console.log("Seed završen.");
}

main().finally(() => prisma.$disconnect());
