"use client";

import { Stat } from "@/components/Shell";

type RevenueRow = {
  date: string;
  shift: string;
  cash: number;
  card: number;
  total: number;
  user: string;
};

type PurchaseRow = {
  date: string;
  supplier: string;
  invoiceNo: string;
  total: number;
};

type ProductSaleRow = {
  name: string;
  qty: number;
  revenue: number;
  cost: number;
};

export function ReportsClient({
  tenantName,
  revenues,
  purchases,
  productSales,
  totalShortageEur,
}: {
  tenantName: string;
  revenues: RevenueRow[];
  purchases: PurchaseRow[];
  productSales: ProductSaleRow[];
  totalShortageEur: number;
}) {
  const totalRevenue = revenues.reduce((s, r) => s + r.total, 0);
  const totalPurchaseCost = purchases.reduce((s, p) => s + p.total, 0);
  const netBalance = totalRevenue - totalPurchaseCost - totalShortageEur;

  const downloadCsv = () => {
    const lines = [
      ["Tip", "Datum / Artikal", "Detalji", "Iznos (EUR)"].join(","),
      ...revenues.map((r) =>
        [
          "PAZAR",
          r.date,
          `"${r.shift} - ${r.user} (Gotovina ${r.cash} / Kartica ${r.card})"`,
          r.total.toFixed(2),
        ].join(",")
      ),
      ...purchases.map((p) =>
        [
          "NABAVKA",
          p.date,
          `"${p.supplier} (Faktura: ${p.invoiceNo})"`,
          (-p.total).toFixed(2),
        ].join(",")
      ),
      ...productSales.map((ps) =>
        [
          "PRODAJA_ARTIKLA",
          `"${ps.name}"`,
          `"Kolicina: ${ps.qty}"`,
          ps.revenue.toFixed(2),
        ].join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tenantName.toLowerCase().replace(/\s+/g, "-")}-izvjestaj.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Izvještaji & Analitika</h1>
          <p className="text-sm text-zinc-400">
            Finansijski bilans, potrošnja po artiklima, troškovi dobavljača, kalo i izvoz u CSV / PDF
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={downloadCsv} className="btn">
            ⬇ Preuzmi CSV (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-ghost"
          >
            🖨️ Štampaj / PDF
          </button>
        </div>
      </div>

      {/* Finansal Özet Kartları */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Ukupan prihod (Pazar)"
          value={<span className="text-emerald-400">€{totalRevenue.toFixed(2)}</span>}
          hint={`${revenues.length} smjena`}
        />
        <Stat
          label="Troškovi nabavke"
          value={<span className="text-amber-400">€{totalPurchaseCost.toFixed(2)}</span>}
          hint={`${purchases.length} primljenih faktura`}
        />
        <Stat
          label="Kalo / Manjak sa popisa"
          value={<span className="text-red-400">€{totalShortageEur.toFixed(2)}</span>}
          hint="Iz zaključanih popisa"
        />
        <Stat
          label="Neto operativni bilans"
          value={
            <span className={netBalance >= 0 ? "text-emerald-400" : "text-red-400"}>
              €{netBalance.toFixed(2)}
            </span>
          }
          hint="Pazar − Nabavka − Manjak"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ürün Satış ve Karlılık Raporu */}
        <div className="card space-y-3">
          <h2 className="font-bold">Prodaja i marža po artiklima (QR & Stolovi)</h2>
          {productSales.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              Nema naplaćenih narudžbi po stolovima.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-400">
                <tr>
                  <th className="py-2">Artikal</th>
                  <th>Prodato</th>
                  <th>Prihod</th>
                  <th className="text-right">Zarada (Marža)</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map((ps) => {
                  const profit = ps.revenue - ps.cost;
                  return (
                    <tr key={ps.name} className="border-b border-zinc-800/60">
                      <td className="py-2 font-bold text-white">{ps.name}</td>
                      <td className="font-mono">{ps.qty}×</td>
                      <td className="font-mono text-amber-400">
                        €{ps.revenue.toFixed(2)}
                      </td>
                      <td className="text-right font-mono font-bold text-emerald-400">
                        +€{profit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Tedarikçi Bazlı Satın Alma Geçmişi */}
        <div className="card space-y-3">
          <h2 className="font-bold">Pregled nabavki po dobavljačima</h2>
          {purchases.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              Još nema primljenih nabavki.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-400">
                <tr>
                  <th className="py-2">Datum</th>
                  <th>Dobavljač</th>
                  <th>Faktura</th>
                  <th className="text-right">Iznos</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-800/60">
                    <td className="py-2 text-zinc-400">{p.date}</td>
                    <td className="font-bold text-white">{p.supplier}</td>
                    <td className="font-mono text-zinc-400">{p.invoiceNo}</td>
                    <td className="text-right font-mono font-bold text-amber-400">
                      €{p.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
