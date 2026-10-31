import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { SuppliersClient } from "./SuppliersClient";

export const dynamic = "force-dynamic";

export default async function DobavljaciPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const suppliers = await db.supplier.findMany({
    where: { tenantId: tenant.id },
    include: {
      products: { where: { active: true }, select: { id: true, name: true, costPrice: true } },
      _count: { select: { purchases: true } },
    },
    orderBy: { name: "asc" },
  });

  return <SuppliersClient slug={slug} suppliers={suppliers} />;
}
