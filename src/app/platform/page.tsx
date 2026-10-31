import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Stat } from "@/components/Shell";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pregled platforme</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Ukupno objekata" value={tenants} hint={`${active} aktivnih · ${suspended} suspendovanih`} />
        <Stat label="MRR (procjena)" value={`€${mrrSum.toFixed(2)}`} hint="Aktivni + plaćeni" />
        <Stat label="Uplate ovog mjeseca" value={`€${(paymentsMonth._sum.amount ?? 0).toFixed(2)}`} />
        <Stat label="Korisnika / narudžbi (mj.)" value={`${users} / ${orders}`} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Pretplate koje ističu (7 dana)</h2>
        {expiring.length === 0 ? (
          <p className="text-sm text-zinc-500">Nema pretplata pred istekom.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {expiring.map((t) => {
              const expired = t.subscriptionEndsAt! < new Date();
              return (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/platform/tenants/${t.id}`} className="hover:text-amber-400">{t.name}</Link>
                  <span className="flex items-center gap-2">
                    {t.subscriptionEndsAt!.toLocaleDateString("sr-Latn")}
                    <Badge tone={expired ? "red" : "amber"}>{expired ? "Isteklo" : "Uskoro"}</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
