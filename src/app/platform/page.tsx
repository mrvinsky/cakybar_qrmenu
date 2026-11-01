import { db } from "@/lib/db";
import { PlatformHomeClient } from "./PlatformHomeClient";

export default async function PlatformHome() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const soon = new Date(Date.now() + 7 * 864e5);

  const [tenants, active, suspended, users, orders, mrr, expiring, paymentsMonth] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { status: "ACTIVE" } }),
    db.tenant.count({ where: { status: "SUSPENDED" } }),
    db.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
    db.tenant.findMany({ where: { status: "ACTIVE", paymentStatus: "PAID" }, include: { plan: true } }),
    db.tenant.findMany({
      where: { subscriptionEndsAt: { lte: soon }, status: "ACTIVE" },
      orderBy: { subscriptionEndsAt: "asc" },
      take: 10,
    }),
    db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart } } }),
  ]);

  const mrrSum = mrr.reduce((a, t) => a + (t.plan?.priceMonthly ?? 0), 0);

  return (
    <PlatformHomeClient
      tenants={tenants}
      active={active}
      suspended={suspended}
      users={users}
      orders={orders}
      mrrSum={mrrSum}
      paymentsMonth={paymentsMonth._sum.amount ?? 0}
      expiring={expiring.map((t) => ({
        id: t.id,
        name: t.name,
        subscriptionEndsAt: t.subscriptionEndsAt!.toISOString(),
        expired: t.subscriptionEndsAt! < new Date(),
      }))}
    />
  );
}
