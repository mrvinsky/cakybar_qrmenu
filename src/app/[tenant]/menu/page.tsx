import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QrMenuClient } from "./QrMenuClient";

export const dynamic = "force-dynamic";

export default async function TenantQrMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ table?: string; sto?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const initialTableNum = Number(sp.table ?? sp.sto ?? 0) || null;

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status !== "ACTIVE") notFound();

  const [categories, rawProducts, tables] = await Promise.all([
    db.category.findMany({
      where: { tenantId: tenant.id, active: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: { tenantId: tenant.id, active: true, sellingPrice: { gt: 0 } },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        sellingPrice: true,
        imageUrl: true,
        isAvailable: true,
        currentQuantity: true,
      },
      orderBy: { name: "asc" },
    }),
    db.table.findMany({
      where: { tenantId: tenant.id, active: true },
      select: { id: true, number: true, name: true },
      orderBy: { number: "asc" },
    }),
  ]);

  // Ne šaljemo tačnu količinu zaliha ni nabavnu cijenu klijentu
  const products = rawProducts.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    sellingPrice: p.sellingPrice,
    imageUrl: p.imageUrl,
    isAvailable: p.isAvailable && p.currentQuantity > 0,
  }));

  return (
    <QrMenuClient
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        qrMode: tenant.qrMode as "MENU_ONLY" | "TABLE_ORDERING",
      }}
      categories={categories}
      products={products}
      tables={tables}
      initialTableNumber={initialTableNum}
    />
  );
}
