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

  const [initialOrders, tables, categories, products] = await Promise.all([
    db.order.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["PENDING", "PREPARING", "SERVED"] },
      },
      include: {
        table: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.table.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { number: "asc" },
    }),
    db.category.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: { tenantId: tenant.id, active: true, sellingPrice: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
  ]);

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
