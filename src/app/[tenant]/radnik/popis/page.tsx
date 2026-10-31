import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { WorkerPopisClient } from "./WorkerPopisClient";

export const dynamic = "force-dynamic";

export default async function WorkerPopisPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);

  // Radnik vidi SAMO trenutno otvoreni popis i NE vidi expectedQuantity niti istoriju popisa!
  const openCount = await db.stockCount.findFirst({
    where: { tenantId: tenant.id, status: "OPEN" },
    include: {
      items: {
        select: {
          productId: true,
          countedQuantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { tenantId: tenant.id, active: true },
      select: {
        id: true,
        name: true,
        unit: true,
        categoryId: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: { tenantId: tenant.id, active: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <WorkerPopisClient
      slug={slug}
      openStockCount={
        openCount
          ? {
              id: openCount.id,
              note: openCount.note,
              createdAt: openCount.createdAt.toISOString(),
              items: openCount.items,
            }
          : null
      }
      products={products}
      categories={categories}
    />
  );
}
