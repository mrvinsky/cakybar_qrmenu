"use client";

import { useState } from "react";
import { saveCountedItemsAction } from "@/app/actions/popis";

type ProductItem = {
  id: string;
  name: string;
  unit: string;
  categoryId: string | null;
  category: { name: string } | null;
};

export function WorkerPopisClient({
  slug,
  openStockCount,
  products,
  categories,
}: {
  slug: string;
  openStockCount: {
    id: string;
    note: string | null;
    createdAt: string;
    items: { productId: string; countedQuantity: number }[];
  } | null;
  products: ProductItem[];
  categories: { id: string; name: string }[];
}) {
  const initialMap: Record<string, number> = {};
  if (openStockCount) {
    for (const it of openStockCount.items) {
      initialMap[it.productId] = it.countedQuantity;
    }
  }

  const [counts, setCounts] = useState<Record<string, number>>(initialMap);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  if (!openStockCount) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Popis zaliha</h1>
        <div className="card py-14 text-center">
          <div className="text-3xl">📋</div>
          <h2 className="mt-2 text-lg font-bold">Trenutno nema otvorenog popisa</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Kada administrator otvori novi popis, ovdje ćete moći unijeti prebrojane količine.
          </p>
        </div>
      </div>
    );
  }

  const filtered = products.filter((p) => {
    if (catFilter !== "ALL" && p.categoryId !== catFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const setQty = (productId: string, val: number) => {
    setCounts((prev) => ({ ...prev, [productId]: Math.max(0, val) }));
    setSavedBanner(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedBanner(false);
    try {
      const entries = products.map((p) => ({
        productId: p.id,
        countedQuantity: counts[p.id] ?? 0,
      }));
      await saveCountedItemsAction(slug, openStockCount.id, entries);
      setSavedBanner(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Unos popisa (Radnik)</h1>
          <p className="text-xs text-zinc-400">
            Unesite stvarno prebrojano stanje u šanku i magacinu. Istorija i očekivane količine su skrivene.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
          🟢 Popis otvoren · {new Date(openStockCount.createdAt).toLocaleDateString("sr-Latn")}
        </span>
      </div>

      {savedBanner && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300">
          ✓ Prebrojane količine su uspješno sačuvane! Administrator sada vidi vaš unos.
        </div>
      )}

      {/* Arama ve Kategori Filtresi */}
      <div className="card flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži artikal..."
          className="input flex-1"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input sm:w-52"
        >
          <option value="ALL">Sve kategorije</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobil Uyumlu Sayım Listesi */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => {
          const val = counts[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-white">{p.name}</div>
                <div className="text-xs text-zinc-400">
                  {p.category?.name ?? "Bez kategorije"} · Jedinica: <strong>{p.unit}</strong>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQty(p.id, val - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={val}
                  onChange={(e) => setQty(p.id, Number(e.target.value))}
                  className="h-10 w-20 rounded-xl border border-zinc-700 bg-zinc-950 text-center font-mono text-base font-bold text-amber-400 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setQty(p.id, val + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-lg font-black text-zinc-950"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sabit Kaydetme Çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur md:left-60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            Ukupno artikala na listi: <strong>{products.length}</strong>
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn px-6 py-3 text-sm font-extrabold"
          >
            {saving ? "Čuvam..." : "Sačuvaj prebrojano stanje →"}
          </button>
        </div>
      </div>
    </div>
  );
}
