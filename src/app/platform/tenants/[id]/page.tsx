import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge, Stat } from "@/components/Shell";
import { addPayment, impersonate, setTenantStatus, updateTenantPlan } from "@/app/actions/platform";

const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

export default async function TenantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await db.tenant.findUnique({
    where: { id },
    include: {
      plan: true,
      payments: { orderBy: { createdAt: "desc" } },
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { tables: true, products: true, orders: true } },
    },
  });
  if (!t) notFound();
  const plans = await db.plan.findMany({ orderBy: { priceMonthly: "asc" } });

  const active = t.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.name}</h1>
          <p className="text-sm text-zinc-400">/{t.slug} · kreiran {t.createdAt.toLocaleDateString("sr-Latn")}</p>
        </div>
        <div className="flex gap-2">
          <form action={impersonate.bind(null, t.id)}><button className="btn-ghost">Prijavi se kao admin</button></form>
          <form action={setTenantStatus.bind(null, t.id, active ? "SUSPENDED" : "ACTIVE")}>
            <button className={active ? "btn-danger" : "btn"}>{active ? "Suspenduj" : "Aktiviraj"}</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Status" value={<Badge tone={active ? "green" : "red"}>{active ? "Aktivan" : "Suspendovan"}</Badge>} />
        <Stat label="Stolovi" value={t._count.tables} />
        <Stat label="Proizvodi" value={t._count.products} />
        <Stat label="Narudžbe" value={t._count.orders} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form action={updateTenantPlan.bind(null, t.id)} className="card space-y-3">
          <h2 className="font-semibold">Pretplata i režim rada</h2>
          <div>
            <label className="label">Tip QR menija (određuje vlasnik platforme)</label>
            <select name="qrMode" defaultValue={t.qrMode} className="input">
              <option value="TABLE_ORDERING">QR Meni + Naručivanje sa stola (poseban QR za svaki sto)</option>
              <option value="MENU_ONLY">Samo digitalni QR Meni (jedan opšti QR kod, bez korpe)</option>
            </select>
          </div>
          <div>
            <label className="label">Plan</label>
            <select name="planId" defaultValue={t.planId ?? ""} className="input">
              <option value="">— bez plana —</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (€{p.priceMonthly}/mj)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status plaćanja</label>
            <select name="paymentStatus" defaultValue={t.paymentStatus} className="input">
              <option value="TRIAL">TRIAL</option><option value="PAID">PAID</option><option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          <div><label className="label">Važi do</label><input type="date" name="subscriptionEndsAt" defaultValue={d(t.subscriptionEndsAt)} className="input" /></div>
          <button className="btn">Sačuvaj</button>
        </form>

        <form action={addPayment.bind(null, t.id)} className="card space-y-3">
          <h2 className="font-semibold">Evidentiraj uplatu</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Iznos (€)</label><input name="amount" type="number" step="0.01" required className="input" defaultValue={t.plan?.priceMonthly} /></div>
            <div>
              <label className="label">Način</label>
              <select name="method" className="input"><option value="BANK">Banka</option><option value="CASH">Gotovina</option><option value="OTHER">Ostalo</option></select>
            </div>
            <div><label className="label">Od</label><input name="periodStart" type="date" required className="input" defaultValue={d(new Date())} /></div>
            <div><label className="label">Do</label><input name="periodEnd" type="date" required className="input" defaultValue={d(new Date(Date.now() + 30 * 864e5))} /></div>
          </div>
          <input name="note" placeholder="Napomena" className="input" />
          <button className="btn">Dodaj uplatu</button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Korisnici</h2>
          <ul className="divide-y divide-zinc-800 text-sm">
            {t.users.map((u) => (
              <li key={u.id} className="flex justify-between py-2">
                <span>{u.name} <span className="text-zinc-500">· {u.email}</span></span>
                <span className="flex gap-2"><Badge>{u.role}</Badge>{!u.active && <Badge tone="red">zamrznut</Badge>}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Istorija uplata</h2>
          {t.payments.length === 0 ? <p className="text-sm text-zinc-500">Nema uplata.</p> : (
            <ul className="divide-y divide-zinc-800 text-sm">
              {t.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>{p.periodStart.toLocaleDateString("sr-Latn")} – {p.periodEnd.toLocaleDateString("sr-Latn")}</span>
                  <span className="font-medium">€{p.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
