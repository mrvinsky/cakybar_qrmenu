import { db } from "@/lib/db";
import { TenantsClientPage } from "./TenantsClientPage";

export default async function TenantsPage() {
  const [tenants, plans] = await Promise.all([
    db.tenant.findMany({
      include: { plan: true, _count: { select: { users: true, tables: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.plan.findMany({ where: { active: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <TenantsClientPage
      plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      tenants={tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        qrMode: t.qrMode,
        planName: t.plan?.name ?? null,
        paymentStatus: t.paymentStatus,
        subscriptionEndsAt: t.subscriptionEndsAt ? t.subscriptionEndsAt.toISOString() : null,
        userCount: t._count.users,
        status: t.status,
      }))}
    />
  );
}
