import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { submitRevenueAction } from "@/app/actions/operations";
import { Badge } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function WorkerPazarPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);

  const todayStart = new Date(new Date().toDateString());

  // Radnik vidi samo sopstvenu predaju pazara za današnji dan (finansijska istorija objekta je skrivena)
  const myTodayRevenues = await db.dailyRevenue.findMany({
    where: {
      tenantId: tenant.id,
      userId: session.uid,
      date: { gte: todayStart },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zatvaranje smjene (Dnevni pazar)</h1>
        <p className="text-sm text-zinc-400">
          Unesite iznos gotovine i kartica na kraju vaše smjene. Ukupan zbir se računa automatski.
        </p>
      </div>

      <form
        action={submitRevenueAction.bind(null, slug)}
        className="card space-y-4"
      >
        <div>
          <label className="label">Smjena *</label>
          <select name="shift" className="input">
            <option value="FIRST">I smjena (Jutarnja)</option>
            <option value="SECOND">II smjena (Večernja)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">💵 Gotovina (€) *</label>
            <input
              name="cash"
              type="number"
              step="0.01"
              min={0}
              required
              placeholder="0.00"
              className="input font-mono text-base font-bold text-amber-400"
            />
          </div>
          <div>
            <label className="label">💳 Kartice (€) *</label>
            <input
              name="card"
              type="number"
              step="0.01"
              min={0}
              required
              placeholder="0.00"
              className="input font-mono text-base font-bold text-sky-400"
            />
          </div>
        </div>

        <div>
          <label className="label">Napomena za smjenu (opciono)</label>
          <input
            name="note"
            placeholder="npr. Plaćen led iz kase €10..."
            className="input"
          />
        </div>

        <button className="btn w-full py-3 text-sm font-extrabold">
          Potvrdi i predaj pazar smjene →
        </button>
      </form>

      {myTodayRevenues.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-bold text-sm text-zinc-300">
            Vaše predate smjene danas ({myTodayRevenues.length})
          </h2>
          <ul className="divide-y divide-zinc-800 text-sm">
            {myTodayRevenues.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <Badge tone="green">
                    {r.shift === "FIRST" ? "I smjena" : "II smjena"}
                  </Badge>
                  <span className="ml-2 text-xs text-zinc-400">
                    Gotovina €{r.cash.toFixed(2)} · Kartica €{r.card.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  €{r.total.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
