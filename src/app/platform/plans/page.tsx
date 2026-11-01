import { db } from "@/lib/db";
import { PlansClientPage } from "./PlansClientPage";

export default async function PlansPage() {
  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: { _count: { select: { tenants: true } } },
  });

  return (
    <PlansClientPage
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.priceMonthly,
        maxUsers: p.maxUsers,
        maxTables: p.maxTables,
        features: p.features,
        tenantCount: p._count.tenants,
      }))}
    />
  );
}
