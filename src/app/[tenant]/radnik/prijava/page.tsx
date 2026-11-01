import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { createNeedReportAction, resolveNeedReportAction } from "@/app/actions/popis";
import { Badge } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function WorkerPrijavaPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);

  const [products, activeReports] = await Promise.all([
    db.product.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true },
    }),
    db.needReport.findMany({
      where: { tenantId: tenant.id, resolved: false },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const levelBadge = (level: string) => {
    if (level === "HITNO") return <Badge tone="red">🚨 HITNO</Badge>;
    if (level === "NEDOSTAJE") return <Badge tone="amber">⚠️ NEDOSTAJE</Badge>;
    return <Badge tone="zinc">⏳ PRI KRAJU</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prijava potrebe za robom</h1>
        <p className="text-sm text-zinc-400">
          Prijavite artikle koji su pri kraju ili nedostaju. Prijava iz I smjene je vidljiva i II smjeni kako se ne bi duplirala.
        </p>
      </div>

      {/* Yeni İhtiyaç Bildirimi Formu */}
      <form
        action={createNeedReportAction.bind(null, slug)}
        className="card grid gap-3.5 sm:grid-cols-12 sm:items-end"
      >
        <div className="sm:col-span-4">
          <label className="label">Artikal *</label>
          <select name="productId" required className="input">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="label">Stepen hitnosti *</label>
          <select name="level" defaultValue="PRI_KRAJU" className="input">
            <option value="PRI_KRAJU">⏳ Pri kraju (za narednu nabavku)</option>
            <option value="NEDOSTAJE">⚠️ Nedostaje (nestalo u šanku)</option>
            <option value="HITNO">🚨 Hitno (potrebno odmah danas)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="label">Napomena (opciono)</label>
          <input
            name="note"
            placeholder="npr. Ostala još samo 1 flaša"
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <button className="btn w-full">+ Prijavi</button>
        </div>
      </form>

      {/* Aktif Bildirimler Listesi (1. ve 2. Vardiya Ortak Görünümü) */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold">
            Aktivne prijave iz trenutne i prethodne smjene ({activeReports.length})
          </h2>
          <span className="text-xs text-zinc-500">
            Automatski ulazi u listu za nabavku
          </span>
        </div>

        {activeReports.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Trenutno nema aktivnih prijava nedostatka robe.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800 text-sm">
            {activeReports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white">{r.product.name}</span>
                    {levelBadge(r.level)}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Prijavio/la: <strong>{r.user?.name ?? "Radnik"}</strong> ·{" "}
                    {r.createdAt.toLocaleString("sr-Latn")}
                    {r.note && (
                      <span className="ml-2 text-amber-300">💬 „{r.note}“</span>
                    )}
                  </div>
                </div>

                <form action={resolveNeedReportAction.bind(null, slug, r.id)}>
                  <button className="btn-ghost text-xs">
                    ✓ Označi kao riješeno
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
