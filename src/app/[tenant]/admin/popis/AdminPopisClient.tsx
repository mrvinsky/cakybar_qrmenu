"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  lockStockCountAction,
  openStockCountAction,
  saveCountedItemsAction,
} from "@/app/actions/popis";
import { Badge, Stat } from "@/components/Shell";

type CountSummary = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  lockedAt: string | null;
};

type CountItem = {
  id: string;
  productId: string;
  expectedQuantity: number;
  countedQuantity: number;
  product: {
    id: string;
    name: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    category: { name: string } | null;
  };
};

export function AdminPopisClient({
  slug,
  allCounts,
  currentCount,
  hasOpen,
}: {
  slug: string;
  allCounts: CountSummary[];
  currentCount: {
    id: string;
    status: "OPEN" | "LOCKED";
    note: string | null;
    createdAt: string;
    lockedAt: string | null;
    items: CountItem[];
  } | null;
  hasOpen: boolean;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filterDiff, setFilterDiff] = useState<"ALL" | "DIFF">("ALL");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentCount) return;
    const map: Record<string, number> = {};
    for (const it of currentCount.items) {
      map[it.productId] = it.countedQuantity;
    }
    setCounts(map);
  }, [currentCount]);

  const isLocked = currentCount?.status === "LOCKED";

  // Fark hesaplamaları
  const items = currentCount?.items ?? [];
  let shortageEur = 0;
  let surplusEur = 0;
  let diffItemsCount = 0;

  for (const it of items) {
    const c = counts[it.productId] ?? it.countedQuantity;
    const diff = c - it.expectedQuantity;
    if (Math.abs(diff) > 0.001) {
      diffItemsCount++;
      const eur = diff * it.product.costPrice;
      if (eur < 0) shortageEur += eur;
      else surplusEur += eur;
    }
  }

  const netEur = shortageEur + surplusEur;

  const visibleItems =
    filterDiff === "ALL"
      ? items
      : items.filter((it) => {
          const c = counts[it.productId] ?? it.countedQuantity;
          return Math.abs(c - it.expectedQuantity) > 0.001;
        });

  const handleSaveDraft = async () => {
    if (!currentCount || isLocked) return;
    setSaving(true);
    try {
      const entries = items.map((it) => ({
        productId: it.productId,
        countedQuantity: counts[it.productId] ?? it.countedQuantity,
      }));
      await saveCountedItemsAction(slug, currentCount.id, entries);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndLock = async () => {
    if (!currentCount || isLocked) return;
    setSaving(true);
    try {
      const entries = items.map((it) => ({
        productId: it.productId,
        countedQuantity: counts[it.productId] ?? it.countedQuantity,
      }));
      await saveCountedItemsAction(slug, currentCount.id, entries);
      await lockStockCountAction(slug, currentCount.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Yeni Popis Açma */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Popis & Obračun razlika (Admin)</h1>
          <p className="text-sm text-zinc-400">
            Uporedite očekivano stanje u sistemu sa prebrojanim stanjem radnika i zaključajte popis
          </p>
        </div>

        {!hasOpen && (
          <form
            action={openStockCountAction.bind(null, slug)}
            className="flex items-center gap-2"
          >
            <input
              name="note"
              placeholder="Napomena (npr. Nedjeljni popis)"
              className="input w-56"
            />
            <button className="btn whitespace-nowrap">+ Otvori novi popis</button>
          </form>
        )}
      </div>

      {/* Geçmiş ve Açık Sayım Seçici */}
      {allCounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allCounts.map((c) => {
            const active = c.id === currentCount?.id;
            return (
              <Link
                key={c.id}
                href={`/${slug}/admin/popis?id=${c.id}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "border-amber-500 bg-amber-500/15 text-amber-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>{new Date(c.createdAt).toLocaleDateString("sr-Latn")}</span>
                <Badge tone={c.status === "OPEN" ? "green" : "zinc"}>
                  {c.status === "OPEN" ? "OTVOREN" : "ZAKLJUČAN"}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}

      {!currentCount ? (
        <div className="card py-14 text-center">
          <div className="text-3xl">📋</div>
          <h2 className="mt-2 text-lg font-bold">Još nema kreiranih popisa</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Kliknite na „+ Otvori novi popis“ u gornjem desnom uglu da započnete prvo brojanje zaliha.
          </p>
        </div>
      ) : (
        <>
          {/* Özet Metrikler */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              label="Status popisa"
              value={
                <Badge tone={isLocked ? "zinc" : "green"}>
                  {isLocked ? "🔒 ZAKLJUČAN" : "🟢 OTVOREN"}
                </Badge>
              }
              hint={currentCount.note ?? "Redovni popis"}
            />
            <Stat
              label="Artikala sa razlikom"
              value={`${diffItemsCount} / ${items.length}`}
              hint="Manjak ili višak"
            />
            <Stat
              label="Ukupan manjak (po nabavnoj)"
              value={<span className="text-red-400">€{shortageEur.toFixed(2)}</span>}
            />
            <Stat
              label="Neto bilans popisa"
              value={
                <span className={netEur < 0 ? "text-red-400" : "text-emerald-400"}>
                  {netEur >= 0 ? "+" : ""}€{netEur.toFixed(2)}
                </span>
              }
              hint={`Višak: +€${surplusEur.toFixed(2)}`}
            />
          </div>

          {/* Araç Çubuğu */}
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterDiff("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  filterDiff === "ALL"
                    ? "bg-amber-500 text-zinc-950"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Svi artikli ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDiff("DIFF")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  filterDiff === "DIFF"
                    ? "bg-amber-500 text-zinc-950"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Samo razlike ({diffItemsCount})
              </button>
            </div>

            {!isLocked && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDraft}
                  className="btn-ghost text-xs"
                >
                  Sačuvaj izmjene
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAndLock}
                  className="btn text-xs"
                >
                  🔒 Zaključaj popis i izjednači zalihe
                </button>
              </div>
            )}
          </div>

          {/* Karşılaştırma Tablosu */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
                <tr>
                  <th className="p-3.5">Artikal</th>
                  <th>Kategorija</th>
                  <th>Očekivano</th>
                  <th>Prebrojano</th>
                  <th>Razlika (kom)</th>
                  <th className="p-3.5 text-right">Finansijska razlika</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((it) => {
                  const countedVal = counts[it.productId] ?? it.countedQuantity;
                  const diff = Number((countedVal - it.expectedQuantity).toFixed(2));
                  const diffEur = diff * it.product.costPrice;

                  return (
                    <tr
                      key={it.id}
                      className="border-b border-zinc-800/60 hover:bg-zinc-800/25"
                    >
                      <td className="p-3.5 font-bold text-white">{it.product.name}</td>
                      <td className="text-xs text-zinc-400">
                        {it.product.category?.name ?? "—"}
                      </td>
                      <td className="font-mono text-zinc-300">
                        {it.expectedQuantity} {it.product.unit}
                      </td>
                      <td>
                        {isLocked ? (
                          <span className="font-mono font-bold text-amber-400">
                            {countedVal} {it.product.unit}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min={0}
                              value={countedVal}
                              onChange={(e) =>
                                setCounts((prev) => ({
                                  ...prev,
                                  [it.productId]: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="h-8 w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 font-mono text-sm font-bold text-amber-400 outline-none focus:border-amber-500"
                            />
                            <span className="text-xs text-zinc-500">{it.product.unit}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={diff === 0 ? "green" : diff < 0 ? "red" : "amber"}
                        >
                          {diff === 0
                            ? "Tačno (0)"
                            : `${diff > 0 ? "+" : ""}${diff} ${it.product.unit}`}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-mono text-xs font-bold">
                        {diff === 0 ? (
                          <span className="text-zinc-500">€0.00</span>
                        ) : (
                          <span className={diffEur < 0 ? "text-red-400" : "text-emerald-400"}>
                            {diffEur > 0 ? "+" : ""}€{diffEur.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
