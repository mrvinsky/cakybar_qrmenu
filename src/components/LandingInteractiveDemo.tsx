"use client";

import { useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  cat: string;
  price: number;
  img: string;
};

const MENU: MenuItem[] = [
  { id: "capp", name: "Cappuccino Grande", cat: "Topli napici", price: 2.8, img: "/hero-dish.jpg" },
  { id: "burg", name: "Gourmet Cheeseburger", cat: "Kuhinja", price: 8.5, img: "/hero-burger.jpg" },
  { id: "past", name: "Truffle Tagliatelle", cat: "Kuhinja", price: 9.9, img: "/hero-pasta.jpg" },
  { id: "cock", name: "Old Fashioned", cat: "Kokteli", price: 6.5, img: "/hero-cocktail.jpg" },
];

type LiveOrder = {
  id: number;
  table: string;
  note: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: "PENDING" | "PREPARING" | "SERVED" | "PAID";
  justArrived?: boolean;
};

export function LandingInteractiveDemo() {
  const [cart, setCart] = useState<Record<string, number>>({ capp: 2, burg: 1 });
  const [note, setNote] = useState("Bez leda u vodi, burger srednje pečen");
  const [sending, setSending] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [revenue, setRevenue] = useState(1480.5);
  const [ordersCount, setOrdersCount] = useState(64);

  const [orders, setOrders] = useState<LiveOrder[]>([
    {
      id: 101,
      table: "Sto 4 · Bašta",
      note: "Bez šećera",
      items: [
        { name: "Cappuccino Grande", qty: 2, price: 2.8 },
        { name: "Old Fashioned", qty: 1, price: 6.5 },
      ],
      total: 12.1,
      status: "PREPARING",
    },
  ]);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const selectedItems = MENU.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => ({
    ...m,
    qty: cart[m.id],
  }));

  const cartTotal = selectedItems.reduce((s, it) => s + it.price * it.qty, 0);
  const cartCount = selectedItems.reduce((s, it) => s + it.qty, 0);

  const sendOrder = () => {
    if (cartCount === 0 || sending) return;
    setSending(true);
    setTimeout(() => {
      const newOrder: LiveOrder = {
        id: Math.floor(100 + Math.random() * 900),
        table: "Sto 4 · Bašta",
        note: note.trim(),
        items: selectedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total: cartTotal,
        status: "PENDING",
        justArrived: true,
      };
      setOrders((prev) => [newOrder, ...prev.slice(0, 2)]);
      setSending(false);
      setRinging(true);
      setTimeout(() => setRinging(false), 2400);
    }, 650);
  };

  const advanceStatus = (id: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const nextStatus =
          o.status === "PENDING"
            ? "PREPARING"
            : o.status === "PREPARING"
            ? "SERVED"
            : "PAID";
        if (nextStatus === "PAID" && o.status !== "PAID") {
          setRevenue((r) => r + o.total);
          setOrdersCount((c) => c + 1);
        }
        return { ...o, status: nextStatus, justArrived: false };
      })
    );
  };

  const latestOrder = orders[0];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 p-4 shadow-[0_30px_100px_-20px_rgba(245,158,11,0.2)] sm:p-8">
      {/* Arka Plan Işıması */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-72 w-72 translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Üst Durum Çubuğu */}
      <div className="relative mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-zinc-200 sm:text-sm">
            Simulacija uživo: dodajte artikle na telefonu gosta i pošaljite narudžbu konobaru
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5">
            <span className="text-zinc-500">Današnji pazar: </span>
            <span className="font-mono font-bold text-emerald-400">€{revenue.toFixed(2)}</span>
          </div>
          <div className="hidden rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 sm:block">
            <span className="text-zinc-500">Naplaćeno narudžbi: </span>
            <span className="font-mono font-bold text-amber-400">{ordersCount}</span>
          </div>
        </div>
      </div>

      {/* İki Telefon + Ortadaki Canlı Sinyal Köprüsü */}
      <div className="relative grid items-center gap-6 lg:grid-cols-11">
        {/* SOL TELEFON: GOST (QR MENI) */}
        <div className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-zinc-950">
                1
              </span>
              Telefon gosta · QR Meni
            </span>
            <span className="font-mono text-[11px] text-zinc-500">Sto 4 · Bašta</span>
          </div>

          {/* iPhone Mockup */}
          <div className="mx-auto max-w-sm rounded-[2.25rem] border-[6px] border-zinc-800 bg-zinc-950 p-3.5 shadow-2xl">
            {/* Dynamic Island */}
            <div className="mx-auto mb-3 h-4 w-24 rounded-full bg-zinc-900" />

            {/* Kafe Başlığı */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900/90 px-3.5 py-2.5">
              <div>
                <div className="text-xs font-extrabold tracking-wide text-white">CAKY BAR</div>
                <div className="text-[11px] text-amber-400">📍 Sto 4 · Digitalni meni</div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Bez čekanja
              </span>
            </div>

            {/* Ürün Listesi */}
            <div className="mt-3 space-y-2">
              {MENU.map((item) => {
                const q = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border p-2 transition ${
                      q > 0
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-zinc-800/80 bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.name}
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-100">{item.name}</div>
                        <div className="text-[11px] font-semibold text-amber-400">
                          €{item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300 hover:border-zinc-500"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-bold">
                        {q}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-zinc-950 hover:bg-amber-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Müşteri Notu */}
            <div className="mt-2.5">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Napomena za šank (npr. bez leda)..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500"
              />
            </div>

            {/* Sipariş Ver Butonu */}
            <button
              type="button"
              onClick={sendOrder}
              disabled={cartCount === 0 || sending}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:opacity-40"
            >
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase opacity-80">
                  {cartCount} artikla u korpi
                </div>
                <div className="text-sm font-black">€{cartTotal.toFixed(2)}</div>
              </div>
              <span className="text-xs font-extrabold">
                {sending ? "Slanje..." : "Pošalji narudžbu →"}
              </span>
            </button>
          </div>
        </div>

        {/* ORTA KÖPRÜ: CANLI SSE SİNYAL HATTI */}
        <div className="flex flex-col items-center justify-center py-2 lg:col-span-1">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg transition duration-300 ${
                sending || ringing
                  ? "scale-110 border-amber-400 bg-amber-500 text-zinc-950 shadow-[0_0_30px_rgba(245,158,11,0.7)]"
                  : "border-zinc-800 bg-zinc-900 text-amber-400"
              }`}
            >
              ⚡
            </div>
            <span className="text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {sending ? "Slanje..." : ringing ? "ZVONI!" : "Instant SSE"}
            </span>
          </div>
        </div>

        {/* SAĞ TELEFON: KONOBAR (PWA UŽIVO) */}
        <div className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-zinc-950">
                2
              </span>
              Telefon konobara · PWA Uživo
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Zvuk uključen
            </span>
          </div>

          {/* iPhone Mockup */}
          <div
            className={`mx-auto max-w-sm rounded-[2.25rem] border-[6px] bg-zinc-950 p-3.5 shadow-2xl transition duration-300 ${
              ringing
                ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.35)]"
                : "border-zinc-800"
            }`}
          >
            {/* Dynamic Island / Canlı Bildirim Bannerı */}
            {ringing ? (
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-amber-500 px-3.5 py-2 text-zinc-950 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔔</span>
                  <div>
                    <div className="text-[11px] font-black uppercase">DING! Nova narudžba</div>
                    <div className="text-[10px] font-semibold">Sto 4 · €{latestOrder?.total.toFixed(2)}</div>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                  SADA
                </span>
              </div>
            ) : (
              <div className="mx-auto mb-3 h-4 w-24 rounded-full bg-zinc-900" />
            )}

            {/* Garson Üst Bar */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900/90 px-3.5 py-2.5">
              <div>
                <div className="text-xs font-extrabold text-white">Aktivne narudžbe</div>
                <div className="text-[11px] text-zinc-400">Smjena I · Konobar Marko</div>
              </div>
              <span className="rounded-lg bg-zinc-800 px-2.5 py-1 font-mono text-xs font-bold text-amber-400">
                {orders.filter((o) => o.status !== "PAID").length} aktivno
              </span>
            </div>

            {/* Sipariş Kartları */}
            <div className="mt-3 space-y-2.5">
              {orders.slice(0, 2).map((o) => {
                const badge =
                  o.status === "PENDING"
                    ? { text: "NOVO · ČEKA", cls: "bg-red-500/20 text-red-300 border-red-500/40" }
                    : o.status === "PREPARING"
                    ? { text: "U PRIPREMI", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" }
                    : o.status === "SERVED"
                    ? { text: "POSLUŽENO", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" }
                    : { text: "NAPLAĆENO ✓", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };

                const btnLabel =
                  o.status === "PENDING"
                    ? "Prihvati i pripremi →"
                    : o.status === "PREPARING"
                    ? "Označi kao posluženo →"
                    : o.status === "SERVED"
                    ? "Naplati (€" + o.total.toFixed(2) + ") →"
                    : "Završeno ✓";

                return (
                  <div
                    key={o.id}
                    className={`rounded-xl border p-3 transition ${
                      o.status === "PENDING"
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">
                        {o.table} <span className="font-mono text-zinc-500">#{o.id}</span>
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>

                    <ul className="mt-2 space-y-0.5 text-xs text-zinc-300">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            <strong>{it.qty}×</strong> {it.name}
                          </span>
                          <span className="font-mono text-zinc-400">
                            €{(it.qty * it.price).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {o.note && (
                      <div className="mt-2 rounded-lg bg-zinc-950/70 px-2.5 py-1 text-[11px] text-amber-300/90">
                        💬 „{o.note}“
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between pt-1">
                      <span className="font-mono text-xs font-extrabold text-amber-400">
                        Ukupno: €{o.total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        disabled={o.status === "PAID"}
                        onClick={() => advanceStatus(o.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          o.status === "PAID"
                            ? "bg-zinc-800 text-zinc-500"
                            : o.status === "PENDING"
                            ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        }`}
                      >
                        {btnLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
