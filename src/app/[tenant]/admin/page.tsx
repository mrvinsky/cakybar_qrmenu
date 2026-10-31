import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { Stat } from "@/components/Shell";

export default async function AdminDashboard({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);
  const tid = tenant.id;
  const today = new Date(new Date().toDateString());

  const [revToday, products, pendingOrders, needs, logs] = await Promise.all([
    db.dailyRevenue.aggregate({ _sum: { total: true }, where: { tenantId: tid, date: { gte: today } } }),
    db.product.findMany({ where: { tenantId: tid, active: true }, select: { currentQuantity: true, minQuantity: true } }),
    db.order.count({ where: { tenantId: tid, status: { in: ["PENDING", "PREPARING"] } } }),
    db.needReport.count({ where: { tenantId: tid, resolved: false } }),
    db.auditLog.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
  ]);
  const low = products.filter((p) => p.currentQuantity <= p.minQuantity).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Pazar danas" value={`€${(revToday._sum.total ?? 0).toFixed(2)}`} />
        <Stat label="Kritične zalihe" value={low} hint={`od ${products.length} proizvoda`} />
        <Stat label="Aktivne narudžbe" value={pendingOrders} />
        <Stat label="Otvorene prijave potreba" value={needs} />
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Posljednje aktivnosti</h2>
        <ul className="divide-y divide-zinc-800 text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex justify-between py-2">
              <span>{l.user?.name ?? "—"} · <span className="font-mono text-xs">{l.action}</span></span>
              <span className="text-zinc-500">{l.createdAt.toLocaleString("sr-Latn")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
