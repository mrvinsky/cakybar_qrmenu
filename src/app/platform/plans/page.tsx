import { db } from "@/lib/db";
import { savePlan } from "@/app/actions/platform";

function PlanForm({ p }: { p?: { id: string; name: string; priceMonthly: number; maxUsers: number; maxTables: number; features: string | null } }) {
  return (
    <form action={savePlan} className="card grid gap-3 md:grid-cols-6 md:items-end">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="md:col-span-2"><label className="label">Naziv</label><input name="name" required defaultValue={p?.name} className="input" /></div>
      <div><label className="label">€/mjesečno</label><input name="priceMonthly" type="number" step="0.01" defaultValue={p?.priceMonthly ?? 0} className="input" /></div>
      <div><label className="label">Max korisnika</label><input name="maxUsers" type="number" defaultValue={p?.maxUsers ?? 5} className="input" /></div>
      <div><label className="label">Max stolova</label><input name="maxTables" type="number" defaultValue={p?.maxTables ?? 20} className="input" /></div>
      <button className="btn">{p ? "Sačuvaj" : "Dodaj plan"}</button>
      <div className="md:col-span-6"><input name="features" placeholder="Opis funkcija" defaultValue={p?.features ?? ""} className="input" /></div>
    </form>
  );
}

export default async function PlansPage() {
  const plans = await db.plan.findMany({ orderBy: { priceMonthly: "asc" }, include: { _count: { select: { tenants: true } } } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Planovi pretplate</h1>
      {plans.map((p) => (
        <div key={p.id}>
          <p className="mb-1 text-xs text-zinc-500">{p._count.tenants} objekata koristi ovaj plan</p>
          <PlanForm p={p} />
        </div>
      ))}
      <h2 className="pt-4 font-semibold">Novi plan</h2>
      <PlanForm />
    </div>
  );
}
