import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { WorkerOrdersClient } from "./WorkerOrdersClient";

export const dynamic = "force-dynamic";

export default async function WorkerLiveOrdersPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);

  const [initialOrders, tables, categories, rawProducts] = await Promise.all([
    db.order.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["PENDING", "PREPARING", "SERVED"] },
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.table.findMany({
      where: { tenantId: tenant.id, active: true },
      select: { id: true, number: true, name: true },
      orderBy: { number: "asc" },
    }),
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
        sellingPrice: true,
        isAvailable: true,
        currentQuantity: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Konobaru ne šaljemo očekivanu količinu zaliha (currentQuantity) niti nabavnu cijenu (costPrice)
  const products = rawProducts.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    sellingPrice: p.sellingPrice,
    isAvailable: p.isAvailable && p.currentQuantity > 0,
  }));

  return (
    <WorkerOrdersClient
      slug={slug}
      initialOrders={initialOrders}
      tables={tables}
      categories={categories}
      products={products}
    />
  );
}
