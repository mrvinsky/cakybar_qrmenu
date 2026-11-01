import Link from "next/link";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { Badge, Stat } from "@/components/Shell";

export default async function AdminDashboard({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);
  const tid = tenant.id;
  const today = new Date(new Date().toDateString());

  const [revToday, products, pendingOrders, needs, recentOrders, notifications] = await Promise.all([
    db.dailyRevenue.aggregate({ _sum: { total: true }, where: { tenantId: tid, date: { gte: today } } }),
    db.product.findMany({ where: { tenantId: tid, active: true }, select: { currentQuantity: true, minQuantity: true } }),
    db.order.count({ where: { tenantId: tid, status: { in: ["PENDING", "PREPARING"] } } }),
    db.needReport.count({ where: { tenantId: tid, resolved: false } }),
    db.order.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { table: true, items: { include: { product: true } } },
    }),
    db.notification.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const low = products.filter((p) => p.currentQuantity <= p.minQuantity).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400">Pregled poslovanja i aktivnosti u objektu {tenant.name}</p>
        </div>
        <Link href={`/${slug}/radnik/narudzbe`} className="btn text-xs">
          🔔 Otvori narudžbe uživo →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Pazar danas" value={`€${(revToday._sum.total ?? 0).toFixed(2)}`} />
        <Stat label="Kritične zalihe" value={low} hint={`od ${products.length} artikala`} />
        <Stat label="Aktivne narudžbe" value={pendingOrders} hint="Stolovi u pripremi" />
        <Stat label="Prijave potreba" value={needs} hint="Čeka nabavku" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Son Siparişler */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="font-bold text-white">Posljednje narudžbe sa stolova</h2>
            <Link href={`/${slug}/radnik/narudzbe`} className="text-xs text-amber-400 hover:underline">
              Sve narudžbe →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">Još nema narudžbi.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/80 text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Sto {o.table.number}</span>
                      <Badge
                        tone={
                          o.status === "PAID"
                            ? "green"
                            : o.status === "PENDING"
                            ? "amber"
                            : o.status === "PREPARING"
                            ? "zinc"
                            : "zinc"
                        }
                      >
                        {o.status === "PAID"
                          ? "Plaćeno"
                          : o.status === "PENDING"
                          ? "Novo"
                          : o.status === "PREPARING"
                          ? "U pripremi"
                          : o.status === "SERVED"
                          ? "Posluženo"
                          : "Otkazano"}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {o.items.length} stavki · {new Date(o.createdAt).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400">€{o.totalAmount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Önemli Bildirimler (Düşük stok, yeni pazar, ihtiyaç bildirimi) */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="font-bold text-white">Obavještenja i operativni događaji</h2>
            <span className="text-xs text-zinc-500">Automatski sistem</span>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">Nema novih obavještenja.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/80 text-sm">
              {notifications.map((n) => (
                <li key={n.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200">{n.title}</span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(n.createdAt).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {n.message && <p className="text-xs text-zinc-400">{n.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
