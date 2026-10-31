"use client";

import { useState } from "react";
import {
  createPurchasesFromSuggestionsAction,
  deletePurchaseAction,
  receivePurchaseAction,
} from "@/app/actions/nabavka";
import { Badge, Stat } from "@/components/Shell";

type Product = {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  optimalQuantity: number;
  costPrice: number;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  category: { name: string } | null;
};

type Supplier = { id: string; name: string };

type NeedReportItem = {
  id: string;
  productId: string;
  level: string;
  note: string | null;
  userName: string;
};

type PurchaseRecord = {
  id: string;
  status: string;
  invoiceNo: string | null;
  totalAmount: number;
  createdAt: string;
  receivedAt: string | null;
  supplierName: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    unit: string;
  }[];
};

type DraftRow = {
  selected: boolean;
  supplierId: string;
  quantity: number;
  unitPrice: number;
};

export function NabavkaClient({
  slug,
  products,
  suppliers,
  openReports,
  purchases,
}: {
  slug: string;
  products: Product[];
  suppliers: Supplier[];
  openReports: NeedReportItem[];
  purchases: PurchaseRecord[];
}) {
  const reportMap = new Map<string, NeedReportItem>();
  for (const r of openReports) {
    if (!reportMap.has(r.productId)) reportMap.set(r.productId, r);
  }

  // Otomatik önerilen ürünler: stok <= minStok VEYA çalışan bildirimi olanlar
  const suggestedProducts = products.filter(
    (p) => p.currentQuantity <= p.minQuantity || reportMap.has(p.id)
  );

  const initialDrafts: Record<string, DraftRow> = {};
  for (const p of products) {
    const isSuggested = p.currentQuantity <= p.minQuantity || reportMap.has(p.id);
    const needed = Math.max(
      1,
      Number(((p.optimalQuantity || p.minQuantity * 2 || 10) - p.currentQuantity).toFixed(1))
    );
    initialDrafts[p.id] = {
      selected: isSuggested,
      supplierId: p.supplierId ?? "",
      quantity: needed,
      unitPrice: p.costPrice,
    };
  }

  const [drafts, setDrafts] = useState<Record<string, DraftRow>>(initialDrafts);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [creating, setCreating] = useState(false);

  const displayedProducts = showAllProducts ? products : suggestedProducts;

  const selectedList = products.filter((p) => drafts[p.id]?.selected && drafts[p.id]?.quantity > 0);
  const estimatedTotal = selectedList.reduce(
    (s, p) => s + drafts[p.id].quantity * drafts[p.id].unitPrice,
    0
  );

  const updateDraft = (productId: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }));
  };

  const handleCreateOrders = async () => {
    if (selectedList.length === 0 || creating) return;
    setCreating(true);
    try {
      await createPurchasesFromSuggestionsAction(
        slug,
        selectedList.map((p) => ({
          productId: p.id,
          supplierId: drafts[p.id].supplierId || null,
          quantity: drafts[p.id].quantity,
          unitPrice: drafts[p.id].unitPrice,
        }))
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pametna Nabavka</h1>
          <p className="text-sm text-zinc-400">
            Automatski prijedlog nabavke prema minimalnim zalihama i prijavama radnika, te prijem robe na stanje
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllProducts((v) => !v)}
          className="btn-ghost"
        >
          {showAllProducts
            ? `Prikaži samo kritične (${suggestedProducts.length})`
            : `Prikaži sve artikle (${products.length})`}
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Za nabavku (predloženo)"
          value={suggestedProducts.length}
          hint="Ispod minimuma ili prijavljeno"
        />
        <Stat
          label="Prijave radnika"
          value={openReports.length}
          hint="Hitno / Nedostaje / Pri kraju"
        />
        <Stat
          label="Procijenjeni trošak"
          value={`€${estimatedTotal.toFixed(2)}`}
          hint={`${selectedList.length} odabranih stavki`}
        />
        <Stat
          label="Čeka isporuku"
          value={purchases.filter((p) => p.status === "ORDERED").length}
          hint="Aktivne narudžbenice"
        />
      </div>

      {/* BÖLÜM 1: OTOMATİK SATIN ALMA LİSTESİ */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="font-bold">1. Lista za nabavku (Predlozi do optimalne zalihe)</h2>
            <p className="text-xs text-zinc-400">
              Prilagodite količinu, dobavljača ili nabavnu cijenu i kreirajte narudžbenice jednim klikom
            </p>
          </div>
          <button
            type="button"
            disabled={selectedList.length === 0 || creating}
            onClick={handleCreateOrders}
            className="btn"
          >
            {creating
              ? "Kreiram..."
              : `Kreiraj narudžbenicu (${selectedList.length} stavki · €${estimatedTotal.toFixed(2)}) →`}
          </button>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">
            🎉 Sve zalihe su iznad minimuma i nema aktivnih prijava radnika! Kliknite na „Prikaži sve artikle“ ako želite ručno kreirati nabavku.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
                <tr>
                  <th className="p-2.5">Uključi</th>
                  <th>Artikal</th>
                  <th>Stanje / Min / Opt</th>
                  <th>Razlog</th>
                  <th>Dobavljač</th>
                  <th>Za naručiti</th>
                  <th>Nabavna (€)</th>
                  <th className="p-2.5 text-right">Ukupno</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const d = drafts[p.id];
                  const rep = reportMap.get(p.id);
                  const isLow = p.currentQuantity <= p.minQuantity;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-zinc-800/60 ${
                        d?.selected ? "bg-amber-500/5" : "opacity-60"
                      }`}
                    >
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={d?.selected ?? false}
                          onChange={(e) =>
                            updateDraft(p.id, { selected: e.target.checked })
                          }
                        />
                      </td>
                      <td className="font-bold text-white">{p.name}</td>
                      <td className="font-mono text-xs">
                        <span className={isLow ? "font-bold text-red-400" : "text-zinc-300"}>
                          {p.currentQuantity} {p.unit}
                        </span>{" "}
                        <span className="text-zinc-500">
                          (min {p.minQuantity} · opt {p.optimalQuantity})
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {isLow && <Badge tone="red">Ispod min.</Badge>}
                          {rep && (
                            <Badge
                              tone={
                                rep.level === "HITNO"
                                  ? "red"
                                  : rep.level === "NEDOSTAJE"
                                  ? "amber"
                                  : "zinc"
                              }
                            >
                              {rep.level} ({rep.userName})
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={d?.supplierId ?? ""}
                          onChange={(e) =>
                            updateDraft(p.id, { supplierId: e.target.value })
                          }
                          className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs"
                        >
                          <option value="">— Bez dobavljača —</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            value={d?.quantity ?? 0}
                            onChange={(e) =>
                              updateDraft(p.id, {
                                quantity: Math.max(0, Number(e.target.value)),
                                selected: true,
                              })
                            }
                            className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 font-mono text-xs font-bold text-amber-400"
                          />
                          <span className="text-xs text-zinc-500">{p.unit}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={d?.unitPrice ?? 0}
                          onChange={(e) =>
                            updateDraft(p.id, {
                              unitPrice: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 font-mono text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono text-xs font-bold text-amber-400">
                        €{((d?.quantity ?? 0) * (d?.unitPrice ?? 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BÖLÜM 2: OLUŞTURULAN SATIN ALMA FİŞLERİ VE MAL KABULÜ (STOĞA AKTARIM) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">2. Narudžbenice i prijem robe ({purchases.length})</h2>
        {purchases.length === 0 ? (
          <div className="card py-10 text-center text-sm text-zinc-500">
            Još nema kreiranih narudžbenica.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {purchases.map((pur) => {
              const isReceived = pur.status === "RECEIVED";
              return (
                <div
                  key={pur.id}
                  className="card flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-base font-extrabold text-white">
                          📦 {pur.supplierName}
                        </div>
                        <div className="text-xs text-zinc-400">
                          Kreirano: {new Date(pur.createdAt).toLocaleString("sr-Latn")}
                          {pur.invoiceNo && ` · Faktura: #${pur.invoiceNo}`}
                        </div>
                      </div>
                      <Badge tone={isReceived ? "green" : "amber"}>
                        {isReceived ? "✓ PRIMLJENO NA STANJE" : "⏳ ČEKA ISPORUKU"}
                      </Badge>
                    </div>

                    <ul className="mt-3 divide-y divide-zinc-800/80 text-xs">
                      {pur.items.map((it) => (
                        <li key={it.id} className="flex justify-between py-1.5">
                          <span>
                            <strong className="text-amber-400">
                              +{it.quantity} {it.unit}
                            </strong>{" "}
                            {it.productName}
                          </span>
                          <span className="font-mono text-zinc-400">
                            €{(it.quantity * it.unitPrice).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Ukupan iznos:</span>
                      <span className="font-mono text-lg font-black text-amber-400">
                        €{pur.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    {!isReceived ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <form
                          action={receivePurchaseAction.bind(null, slug, pur.id)}
                          className="flex flex-1 gap-2"
                        >
                          <input
                            name="invoiceNo"
                            placeholder="Br. fakture / otpremnice"
                            className="input text-xs"
                          />
                          <button className="btn whitespace-nowrap text-xs">
                            ✓ Potvrdi prijem (Dodaj na stanje)
                          </button>
                        </form>
                        <form action={deletePurchaseAction.bind(null, slug, pur.id)}>
                          <button className="btn-ghost text-xs text-red-400">
                            Otkaži
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400">
                        ✓ Roba primljena i dodata u inventar{" "}
                        {pur.receivedAt &&
                          `(${new Date(pur.receivedAt).toLocaleDateString("sr-Latn")})`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
