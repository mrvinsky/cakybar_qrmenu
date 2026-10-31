import Link from "next/link";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { deleteRevenueAction, submitRevenueAction } from "@/app/actions/operations";
import { Badge, Stat } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function AdminPazarPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const period = sp.period ?? "month";
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const now = new Date();
  let startDate: Date | undefined;
  if (period === "day") {
    startDate = new Date(now.toDateString());
  } else if (period === "week") {
    startDate = new Date(now.getTime() - 7 * 864e5);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const revenues = await db.dailyRevenue.findMany({
    where: {
      tenantId: tenant.id,
      ...(startDate ? { date: { gte: startDate } } : {}),
    },
    include: { user: true },
    orderBy: { date: "desc" },
  });

  const sumCash = revenues.reduce((s, r) => s + r.cash, 0);
  const sumCard = revenues.reduce((s, r) => s + r.card, 0);
  const sumTotal = revenues.reduce((s, r) => s + r.total, 0);

  const periods = [
    { id: "day", label: "Danas" },
    { id: "week", label: "7 dana" },
    { id: "month", label: "Ovaj mjesec" },
    { id: "year", label: "Ova godina" },
    { id: "all", label: "Sve" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dnevni pazar (Finansije po smjenama)</h1>
          <p className="text-sm text-zinc-400">
            Pregled gotovine, kartica i ukupnog prometa po smjenama i periodima
          </p>
        </div>

        {/* Dönem Filtreleri */}
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {periods.map((p) => (
            <Link
              key={p.id}
              href={`/${slug}/admin/pazar?period=${p.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                period === p.id
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Özet Metrikler */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Ukupan promet"
          value={<span className="text-emerald-400">€{sumTotal.toFixed(2)}</span>}
          hint={`${revenues.length} predatih smjena`}
        />
        <Stat
          label="💵 Gotovina ukupno"
          value={`€${sumCash.toFixed(2)}`}
          hint={sumTotal > 0 ? `${Math.round((sumCash / sumTotal) * 100)}% prometa` : "0%"}
        />
        <Stat
          label="💳 Kartice ukupno"
          value={`€${sumCard.toFixed(2)}`}
          hint={sumTotal > 0 ? `${Math.round((sumCard / sumTotal) * 100)}% prometa` : "0%"}
        />
        <Stat
          label="Prosjek po smjeni"
          value={`€${revenues.length > 0 ? (sumTotal / revenues.length).toFixed(2) : "0.00"}`}
        />
      </div>

      {/* Admin Hızlı Ciro Ekleme Formu */}
      <form
        action={submitRevenueAction.bind(null, slug)}
        className="card grid gap-3 sm:grid-cols-6 sm:items-end"
      >
        <div>
          <label className="label">Datum</label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Smjena</label>
          <select name="shift" className="input">
            <option value="FIRST">I smjena</option>
            <option value="SECOND">II smjena</option>
          </select>
        </div>
        <div>
          <label className="label">Gotovina (€)</label>
          <input
            name="cash"
            type="number"
            step="0.01"
            min={0}
            required
            placeholder="0.00"
            className="input"
          />
        </div>
        <div>
          <label className="label">Kartica (€)</label>
          <input
            name="card"
            type="number"
            step="0.01"
            min={0}
            required
            placeholder="0.00"
            className="input"
          />
        </div>
        <div>
          <label className="label">Napomena</label>
          <input name="note" placeholder="Opciono..." className="input" />
        </div>
        <button className="btn">+ Dodaj pazar</button>
      </form>

      {/* Pazar Tablosu */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
            <tr>
              <th className="p-3.5">Datum</th>
              <th>Smjena</th>
              <th>Predao/la</th>
              <th>Gotovina</th>
              <th>Kartica</th>
              <th>Ukupno</th>
              <th>Napomena</th>
              <th className="p-3.5 text-right">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {revenues.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-800/60 hover:bg-zinc-800/25"
              >
                <td className="p-3.5 font-medium">
                  {r.date.toLocaleDateString("sr-Latn")}
                </td>
                <td>
                  <Badge tone={r.shift === "FIRST" ? "amber" : "zinc"}>
                    {r.shift === "FIRST" ? "I smjena" : "II smjena"}
                  </Badge>
                </td>
                <td className="text-zinc-300">{r.user?.name ?? "—"}</td>
                <td className="font-mono text-amber-400">€{r.cash.toFixed(2)}</td>
                <td className="font-mono text-sky-400">€{r.card.toFixed(2)}</td>
                <td className="font-mono font-bold text-emerald-400">
                  €{r.total.toFixed(2)}
                </td>
                <td className="max-w-xs truncate text-xs text-zinc-400">
                  {r.note ?? "—"}
                </td>
                <td className="p-3.5 text-right">
                  <form action={deleteRevenueAction.bind(null, slug, r.id)}>
                    <button className="text-xs text-zinc-500 hover:text-red-400">
                      Obriši
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
