"use client";

import { useCallback, useEffect, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string | Date;
  table: { id: string; number: number; name: string | null };
  items: OrderItem[];
};

type TableItem = { id: string; number: number; name: string | null };
type Category = { id: string; name: string };
type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  sellingPrice: number;
  isAvailable: boolean;
  currentQuantity: number;
};

// Web Audio API ile gerçek sipariş zili ("DING-DONG!")
function playOrderBell() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const tone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    tone(880, now, 0.35);       // A5 (Ding)
    tone(1174.66, now + 0.18, 0.55); // D6 (Dong)
  } catch {
    // Ses izni yoksa sessiz geç
  }
}

export function WorkerOrdersClient({
  slug,
  initialOrders,
  tables,
  categories,
  products,
}: {
  slug: string;
  initialOrders: Order[];
  tables: TableItem[];
  categories: Category[];
  products: Product[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [mode, setMode] = useState<"LIVE" | "POS">("LIVE");
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Garson POS (Masaya sipariş açma) state
  const [selectedTable, setSelectedTable] = useState<number>(tables[0]?.number ?? 1);
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [posNote, setPosNote] = useState("");
  const [posSaving, setPosSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/worker/orders?slug=${slug}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
  }, [slug]);

  // SSE Canlı Akış Bağlantısı
  useEffect(() => {
    const es = new EventSource("/api/worker/orders/live");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "NEW_ORDER") {
          fetchOrders();
          if (soundEnabled) playOrderBell();
          setAlertBanner(`🔔 Nova narudžba sa Stola ${data.tableNumber}!`);
          setTimeout(() => setAlertBanner(null), 5000);
        } else if (data.type === "STATUS_CHANGED") {
          fetchOrders();
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [fetchOrders, soundEnabled]);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch("/api/worker/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  };

  const changePosQty = (productId: string, delta: number) => {
    setPosCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[productId];
      else copy[productId] = next;
      return copy;
    });
  };

  const posItems = products
    .filter((p) => (posCart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: posCart[p.id] }));

  const posTotal = posItems.reduce((s, i) => s + i.qty * i.product.sellingPrice, 0);

  const submitWaiterOrder = async () => {
    if (posItems.length === 0 || posSaving) return;
    setPosSaving(true);
    try {
      const res = await fetch("/api/menu/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableNumber: selectedTable,
          notes: posNote,
          source: "WAITER",
          items: posItems.map((i) => ({ productId: i.product.id, quantity: i.qty })),
        }),
      });
      if (res.ok) {
        setPosCart({});
        setPosNote("");
        setMode("LIVE");
        fetchOrders();
      }
    } finally {
      setPosSaving(false);
    }
  };

  const visibleProducts =
    selectedCat === "ALL"
      ? products
      : products.filter((p) => p.categoryId === selectedCat);

  return (
    <div className="space-y-6">
      {/* Canlı Bildirim Pop-up Banner */}
      {alertBanner && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-400 bg-amber-500 px-5 py-3.5 text-zinc-950 shadow-2xl">
          <span className="text-base font-black">{alertBanner}</span>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            className="rounded-lg bg-zinc-950 px-3 py-1 text-xs font-bold text-amber-400"
          >
            U redu
          </button>
        </div>
      )}

      {/* Üst Başlık ve Hibrit Sekmeler */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Narudžbe uživo & Stolovi</h1>
          <p className="text-xs text-zinc-400">
            Pratite QR narudžbe gostiju ili sami otvorite narudžbu za odabrani sto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled((v) => !v);
              if (!soundEnabled) playOrderBell();
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
              soundEnabled
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-400"
            }`}
          >
            {soundEnabled ? "🔔 Zvuk uključen" : "🔕 Zvuk isključen"}
          </button>

          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setMode("LIVE")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                mode === "LIVE" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
              }`}
            >
              Aktivne narudžbe ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setMode("POS")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                mode === "POS" ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
              }`}
            >
              + Otvori sto (Konobar)
            </button>
          </div>
        </div>
      </div>

      {/* SEKME 1: CANLI SİPARİŞ EKRANI (KDS) */}
      {mode === "LIVE" && (
        <>
          {orders.length === 0 ? (
            <div className="card py-14 text-center">
              <div className="text-3xl">☕</div>
              <div className="mt-2 font-bold">Trenutno nema aktivnih narudžbi</div>
              <p className="mt-1 text-xs text-zinc-500">
                Čim gost naruči preko QR koda ili vi otvorite sto, narudžba se pojavljuje ovdje.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((o) => {
                const isPending = o.status === "PENDING";
                const isPrep = o.status === "PREPARING";
                return (
                  <div
                    key={o.id}
                    className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                      isPending
                        ? "border-amber-500 bg-amber-500/10 shadow-[0_0_35px_-10px_rgba(245,158,11,0.4)]"
                        : isPrep
                        ? "border-sky-500/40 bg-zinc-900/80"
                        : "border-emerald-500/40 bg-zinc-900/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-white">
                          Sto {o.table.number}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isPending
                              ? "bg-amber-500 text-zinc-950"
                              : isPrep
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {isPending ? "NOVO" : isPrep ? "U PRIPREMI" : "POSLUŽENO"}
                        </span>
                      </div>

                      <ul className="mt-3 divide-y divide-zinc-800/80 text-sm">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex justify-between py-1.5">
                            <span>
                              <strong className="text-amber-400">{it.quantity}×</strong>{" "}
                              {it.product.name}
                            </span>
                            <span className="font-mono text-zinc-400">
                              €{(it.quantity * it.unitPrice).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {o.notes && (
                        <div className="mt-3 rounded-xl bg-zinc-950/80 p-2.5 text-xs text-amber-300">
                          💬 Napomena: „{o.notes}“
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Ukupno:</span>
                        <span className="font-mono text-lg font-black text-amber-400">
                          €{o.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => updateStatus(o.id, "PREPARING")}
                            className="btn flex-1"
                          >
                            Prihvati (U pripremi)
                          </button>
                        )}
                        {isPrep && (
                          <button
                            type="button"
                            onClick={() => updateStatus(o.id, "SERVED")}
                            className="flex-1 rounded-xl bg-sky-500 py-2 text-xs font-bold text-zinc-950 hover:bg-sky-400"
                          >
                            Označi kao posluženo ✓
                          </button>
                        )}
                        {o.status === "SERVED" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(o.id, "PAID")}
                            className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
                          >
                            Naplati i zatvori (€{o.totalAmount.toFixed(2)})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => updateStatus(o.id, "CANCELLED")}
                          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-red-500 hover:text-red-400"
                        >
                          Otkaži
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SEKME 2: GARSON MASA SEÇİP SİPARİŞ GİRİŞİ (POS) */}
      {mode === "POS" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {/* Masa Seçimi */}
            <div className="card">
              <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                1. Odaberite sto
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {tables.map((t) => {
                  const hasActive = orders.some((o) => o.table.number === t.number);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTable(t.number)}
                      className={`relative rounded-xl border py-3 text-center text-xs font-extrabold transition ${
                        selectedTable === t.number
                          ? "border-amber-500 bg-amber-500 text-zinc-950"
                          : hasActive
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      Sto {t.number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kategori ve Ürün Seçimi */}
            <div className="card space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCat("ALL")}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                    selectedCat === "ALL" ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  Sve
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCat(c.id)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-bold ${
                      selectedCat === c.id ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {visibleProducts.map((p) => {
                  const qty = posCart[p.id] ?? 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => changePosQty(p.id, 1)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                        qty > 0
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          €{p.sellingPrice.toFixed(2)}
                        </span>
                        {qty > 0 && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-xs font-black text-zinc-950">
                            {qty}×
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sağ Adisyon Özeti */}
          <div className="lg:col-span-4">
            <div className="card sticky top-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="font-extrabold">Nova narudžba · Sto {selectedTable}</h2>
                {posItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPosCart({})}
                    className="text-xs text-zinc-400 hover:text-red-400"
                  >
                    Isprazni
                  </button>
                )}
              </div>

              {posItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  Kliknite na artikle lijevo da ih dodate na Sto {selectedTable}.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {posItems.map(({ product: p, qty }) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span>
                        <strong className="text-amber-400">{qty}×</strong> {p.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">
                          €{(qty * p.sellingPrice).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => changePosQty(p.id, -1)}
                          className="h-6 w-6 rounded bg-zinc-800 text-xs font-bold"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                value={posNote}
                onChange={(e) => setPosNote(e.target.value)}
                placeholder="Napomena za šank..."
                className="input"
              />

              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-zinc-400">Ukupno:</span>
                <span className="font-mono text-xl font-black text-amber-400">
                  €{posTotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={posItems.length === 0 || posSaving}
                onClick={submitWaiterOrder}
                className="btn w-full py-3"
              >
                {posSaving ? "Otvaram..." : `Otvori narudžbu za Sto ${selectedTable} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
