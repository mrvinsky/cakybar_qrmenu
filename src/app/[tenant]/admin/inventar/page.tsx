import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { InventoryClient } from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventarPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const [products, categories, suppliers] = await Promise.all([
    db.product.findMany({
      where: { tenantId: tenant.id },
      include: { category: true, supplier: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.category.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.supplier.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <InventoryClient
      slug={slug}
      products={products}
      categories={categories}
      suppliers={suppliers}
    />
  );
}
