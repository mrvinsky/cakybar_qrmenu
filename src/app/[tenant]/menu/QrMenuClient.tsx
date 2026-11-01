"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string };
type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  sellingPrice: number;
  imageUrl: string | null;
  isAvailable: boolean;
};
type TableItem = { id: string; number: number; name: string | null };

type TrackedOrder = {
  id: string;
  status: string;
  totalAmount: number;
  table: { number: number; name: string | null };
  items: { id: string; quantity: number; unitPrice: number; product: { name: string } }[];
};

export function QrMenuClient({
  tenant,
  categories,
  products,
  tables,
  initialTableNumber,
}: {
  tenant: { name: string; slug: string; qrMode: "MENU_ONLY" | "TABLE_ORDERING" };
  categories: Category[];
  products: Product[];
  tables: TableItem[];
  initialTableNumber: number | null;
}) {
  const canOrder = tenant.qrMode === "TABLE_ORDERING";
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [tableNumber, setTableNumber] = useState<number>(
    initialTableNumber && tables.some((t) => t.number === initialTableNumber)
      ? initialTableNumber
      : tables[0]?.number ?? 1
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<TrackedOrder | null>(null);

  // Aktif sipariş varsa durumunu periyodik sorgula (müşteri "U pripremi" / "Posluženo" görsün)
  useEffect(() => {
    if (!activeOrder || activeOrder.status === "PAID" || activeOrder.status === "CANCELLED") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/menu/order?id=${activeOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) setActiveOrder(data.order);
        }
      } catch {
        // ignore
      }
    }, 3500);
    return () => clearInterval(id);
  }, [activeOrder]);

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[productId];
      else copy[productId] = next;
      return copy;
    });
  };

  const cartItems = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.id] }));

  const totalCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.qty * i.product.sellingPrice, 0);

  const visibleProducts =
    selectedCat === "ALL"
      ? products
      : products.filter((p) => p.categoryId === selectedCat);

  const currentTable = tables.find((t) => t.number === tableNumber);

  const submitOrder = async () => {
    if (cartItems.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/menu/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenant.slug,
          tableNumber,
          notes,
          source: "QR",
          items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Greška pri slanju narudžbe.");
      } else {
        setActiveOrder(data.order);
        setCart({});
        setNotes("");
        setDrawerOpen(false);
      }
    } catch {
      setError("Mrežna greška. Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      {/* Üst Bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-amber-400">
              {tenant.name}
            </h1>
            <p className="text-xs text-zinc-400">
              {canOrder ? "Digitalni QR Meni & Naručivanje sa stola" : "Digitalni QR Meni (Cjenovnik)"}
            </p>
          </div>

          {/* Masa Göstergesi (Sadece masadan sipariş aktifse gösterilir) */}
          {canOrder ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5">
              <span className="text-xs text-amber-300">📍</span>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="bg-transparent text-xs font-extrabold text-amber-300 outline-none"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.number} className="bg-zinc-900 text-zinc-100">
                    Sto {t.number} {t.name && t.name !== `Sto ${t.number}` ? `(${t.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              Za narudžbu pozovite konobara
            </span>
          )}
        </div>

        {/* Kategori Sekmeleri */}
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 pb-3">
          <button
            type="button"
            onClick={() => setSelectedCat("ALL")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition ${
              selectedCat === "ALL"
                ? "bg-amber-500 text-zinc-950"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400"
            }`}
          >
            Svi artikli
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCat(c.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition ${
                selectedCat === c.id
                  ? "bg-amber-500 text-zinc-950"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {/* Aktif Sipariş Canlı Durum Kartı */}
        {activeOrder && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Vaša narudžba · Sto {activeOrder.table.number}
              </span>
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-black text-zinc-950">
                {activeOrder.status === "PENDING"
                  ? "🔔 Primljeno – čeka šank"
                  : activeOrder.status === "PREPARING"
                  ? "👨‍🍳 U pripremi"
                  : activeOrder.status === "SERVED"
                  ? "✅ Posluženo za vašim stolom"
                  : "Završeno"}
              </span>
            </div>
            <ul className="mt-2.5 space-y-1 text-xs text-zinc-200">
              {activeOrder.items.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>
                    <strong>{it.quantity}×</strong> {it.product.name}
                  </span>
                  <span className="font-mono">€{(it.quantity * it.unitPrice).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex items-center justify-between border-t border-emerald-500/20 pt-2 text-xs font-bold">
              <span>Ukupno</span>
              <span className="font-mono text-sm text-emerald-300">
                €{activeOrder.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Ürün Kartları */}
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleProducts.map((p) => {
            const available = p.isAvailable;
            const qty = cart[p.id] ?? 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                  !available
                    ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                    : qty > 0
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-zinc-800/90 bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xl">
                      🍹
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{p.name}</div>
                    {p.description && (
                      <div className="line-clamp-1 text-xs text-zinc-400">{p.description}</div>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-amber-400">
                        €{p.sellingPrice.toFixed(2)}
                      </span>
                      {!available && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          Rasprodato
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {canOrder && available && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {qty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => changeQty(p.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-base font-bold"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-mono text-sm font-bold">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => changeQty(p.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-base font-black text-zinc-950"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Alt Sepet Çubuğu */}
      {totalCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-amber-500 px-5 py-3.5 text-zinc-950 shadow-lg shadow-amber-500/25"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 font-mono text-xs font-bold text-amber-400">
                  {totalCount}
                </span>
                <span className="text-sm font-extrabold">
                  Pregledaj korpu · Sto {currentTable?.number ?? tableNumber}
                </span>
              </div>
              <span className="font-mono text-base font-black">€{totalPrice.toFixed(2)} →</span>
            </button>
          </div>
        </div>
      )}

      {/* Sepet Onay Çekmecesi (Modal) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-extrabold">Potvrda narudžbe</h2>
                <p className="text-xs text-amber-400">📍 Sto {tableNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
              >
                Zatvori
              </button>
            </div>

            <div className="mt-4 max-h-60 space-y-2.5 overflow-y-auto">
              {cartItems.map(({ product: p, qty }) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-amber-400">{qty}×</span> {p.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">€{(qty * p.sellingPrice).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(p.id, -1)}
                      className="h-6 w-6 rounded bg-zinc-800 text-xs font-bold"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => changeQty(p.id, 1)}
                      className="h-6 w-6 rounded bg-amber-500 text-xs font-bold text-zinc-950"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="label">Napomena za konobara / šank (opciono)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="npr. Bez leda, manje šećera..."
                className="input"
              />
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <div className="text-xs text-zinc-400">Ukupno za plaćanje</div>
                <div className="font-mono text-2xl font-black text-amber-400">
                  €{totalPrice.toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={submitOrder}
                className="btn px-6 py-3 text-sm font-extrabold"
              >
                {submitting ? "Šaljem..." : "Pošalji narudžbu →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
