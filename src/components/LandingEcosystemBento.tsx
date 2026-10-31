"use client";

import { useState } from "react";

export function LandingEcosystemBento() {
  // 1. Popis state
  const [counted, setCounted] = useState<Record<string, number>>({
    jack: 6,
    heineken: 45,
    espresso: 4,
  });
  const [popisLocked, setPopisLocked] = useState(false);

  // 2. Nabavka state
  const [orderGenerated, setOrderGenerated] = useState(false);

  // 3. Pazar state
  const [shift, setShift] = useState<"ALL" | "FIRST" | "SECOND">("ALL");

  // 4. Stolovi & Katalog toggle
  const [soldOut, setSoldOut] = useState(false);
  const [auditLogs, setAuditLogs] = useState([
    { time: "14:22", user: "Marko (Radnik)", action: "Prijava potrebe: Limeta (HITNO)" },
    { time: "14:15", user: "Admin", action: "Zaključan popis #18 · Tačnost 99.1%" },
    { time: "13:50", user: "Jelena (Radnik)", action: "Predata I smjena · €740.00" },
  ]);

  const addLog = (user: string, action: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAuditLogs((prev) => [{ time, user, action }, ...prev.slice(0, 2)]);
  };

  const popisItems = [
    { id: "jack", name: "Jack Daniel's 0.7L", unit: "boca", expected: 6, cost: 18 },
    { id: "heineken", name: "Heineken 0.33L", unit: "kom", expected: 48, cost: 1.4 },
    { id: "espresso", name: "Lavazza Espresso", unit: "kg", expected: 4, cost: 16 },
  ];

  const shiftData = {
    ALL: { cash: 920, card: 640, total: 1560, label: "Obje smjene danas" },
    FIRST: { cash: 480, card: 260, total: 740, label: "I smjena (08:00 – 16:00)" },
    SECOND: { cash: 440, card: 380, total: 820, label: "II smjena (16:00 – 00:00)" },
  }[shift];

  const cashPct = Math.round((shiftData.cash / shiftData.total) * 100);

  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-12">
      {/* KART 1: PAMETNI POPIS (7 kolon) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-950 p-6 shadow-xl transition hover:border-sky-500/40 lg:col-span-7 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
              📋 Pametni Popis (Admin & Radnik)
            </span>
            <span className="font-mono text-xs text-zinc-500">Slijepi popis za radnike · Automatski obračun</span>
          </div>

          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">
            Kraj papirnim listama i skrivenom manjku u šanku
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Radnik na telefonu unosi samo zatečeno stanje (bez uvida u očekivanu količinu). Vlasnik u sekundi vidi svaku razliku i finansijski bilans.
          </p>
        </div>

        {/* İnteraktif Popis Tablosu */}
        <div className="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">Isprobaj obračun razlike uživo:</span>
            <span className={`rounded-full px-2.5 py-0.5 font-bold ${popisLocked ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"}`}>
              {popisLocked ? "🔒 Popis zaključan" : "🟢 Otvoren popis"}
            </span>
          </div>

          <div className="space-y-2.5">
            {popisItems.map((it) => {
              const c = counted[it.id] ?? it.expected;
              const diff = c - it.expected;
              const diffEur = diff * it.cost;
              return (
                <div
                  key={it.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-zinc-100">{it.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      Očekivano u sistemu: <strong className="text-zinc-300">{it.expected} {it.unit}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={popisLocked}
                        onClick={() => {
                          setCounted((p) => ({ ...p, [it.id]: Math.max(0, c - 1) }));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-bold hover:border-zinc-500 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold text-white">
                        {c}
                      </span>
                      <button
                        type="button"
                        disabled={popisLocked}
                        onClick={() => {
                          setCounted((p) => ({ ...p, [it.id]: c + 1 }));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-bold hover:border-zinc-500 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <div
                      className={`min-w-[92px] rounded-lg px-2.5 py-1 text-right font-mono font-bold ${
                        diff === 0
                          ? "bg-emerald-500/15 text-emerald-400"
                          : diff < 0
                          ? "bg-red-500/15 text-red-400"
                          : "bg-sky-500/15 text-sky-400"
                      }`}
                    >
                      {diff === 0 ? "Tačno (0)" : `${diff > 0 ? "+" : ""}${diff} (${diffEur > 0 ? "+" : ""}€${diffEur.toFixed(1)})`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
            <span className="text-xs text-zinc-400">
              Zaključavanjem popisa zalihe se automatski ažuriraju.
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !popisLocked;
                setPopisLocked(next);
                addLog("Admin", next ? "Zaključan popis i ažurirane zalihe" : "Ponovo otvoren popis");
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                popisLocked
                  ? "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  : "bg-sky-500 text-zinc-950 hover:bg-sky-400"
              }`}
            >
              {popisLocked ? "Otključaj za izmjenu" : "Zaključaj i izjednači stanje →"}
            </button>
          </div>
        </div>
      </div>

      {/* KART 2: AUTOMATSKA NABAVKA & PRIJAVE RADNIKA (5 kolon) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-950 p-6 shadow-xl transition hover:border-amber-500/40 lg:col-span-5 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            🛒 Pametna Nabavka & Prijave
          </span>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">
            Sistem sam zna šta treba naručiti od kog dobavljača
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Kombinuje minimalne zalihe sa prijavama radnika iz smjene („Pri kraju“, „Nedostaje“, „Hitno“) bez dupliranja između I i II smjene.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4">
          <div className="space-y-2 text-xs">
            {[
              { item: "Coca-Cola 0.25L", stock: "12 / min 48", tag: "HITNO", tone: "bg-red-500/20 text-red-300 border-red-500/40", orderQty: "+6 gajbi" },
              { item: "Svježa Limeta", stock: "0.4 kg / min 3 kg", tag: "NEDOSTAJE", tone: "bg-amber-500/20 text-amber-300 border-amber-500/40", orderQty: "+5 kg" },
              { item: "Schweppes Tonic", stock: "18 / min 36", tag: "PRI KRAJU", tone: "bg-sky-500/20 text-sky-300 border-sky-500/40", orderQty: "+3 gajbe" },
            ].map((row) => (
              <div key={row.item} className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-2.5">
                <div>
                  <div className="font-bold text-zinc-100">{row.item}</div>
                  <div className="text-[11px] text-zinc-500">Stanje: {row.stock}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${row.tone}`}>
                    {row.tag}
                  </span>
                  {orderGenerated && (
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                      {row.orderQty}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !orderGenerated;
              setOrderGenerated(next);
              if (next) addLog("Admin", "Kreirana narudžbenica dobavljačima (3 stavke)");
            }}
            className="mt-3.5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-zinc-950 transition hover:bg-amber-400"
          >
            {orderGenerated ? "✓ Narudžbenica spremna (Klikni za reset)" : "Generiši automatsku listu za nabavku →"}
          </button>
        </div>
      </div>

      {/* KART 3: DNEVNI PAZAR PO SMJENAMA (5 kolon) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-950 p-6 shadow-xl transition hover:border-emerald-500/40 lg:col-span-5 sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            💶 Dnevni Pazar & Smjene
          </span>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">
            Predaja smjene u 10 sekundi, potpuna finansijska slika
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Razdvajanje gotovine i kartica po smjenama, automatski zbir i filteri po danu, sedmici, mjesecu i godini.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4">
          <div className="flex gap-1.5 rounded-xl bg-zinc-900 p-1 text-xs">
            {[
              { id: "ALL", label: "Ukupno danas" },
              { id: "FIRST", label: "I Smjena" },
              { id: "SECOND", label: "II Smjena" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShift(s.id as "ALL" | "FIRST" | "SECOND")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                  shift === s.id ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-[11px] text-zinc-500">{shiftData.label}</div>
              <div className="text-3xl font-black text-white">€{shiftData.total.toFixed(2)}</div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
              +14.2% vs prosjek
            </span>
          </div>

          {/* Gotovina vs Kartica Bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-amber-400">💵 Gotovina: €{shiftData.cash} ({cashPct}%)</span>
              <span className="text-sky-400">💳 Kartica: €{shiftData.card} ({100 - cashPct}%)</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
              <div style={{ width: `${cashPct}%` }} className="bg-amber-400 transition-all duration-300" />
              <div style={{ width: `${100 - cashPct}%` }} className="bg-sky-400 transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* KART 4: KATALOG, QR STOLOVI & AUDIT LOG (7 kolon) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-950 p-6 shadow-xl transition hover:border-purple-500/40 lg:col-span-7 sm:p-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
              🛡️ Kontrola Kataloga & Audit Log
            </span>
            <span className="font-mono text-xs text-zinc-500">CSV / PDF Izvještaji · RBAC zaštita</span>
          </div>

          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">
            Jednim klikom označite „Rasprodato“ i pratite ko je šta promijenio
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Nestalo je nekog artikla u sred gužve? Isključite ga jednim dodirom i gosti ga u istom sekundu vide kao „Rasprodato“ na QR meniju. Svaka akcija u sistemu ostaje trajno zabilježena.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Anlık Ürün Durumu Toggle */}
          <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4">
            <div className="text-xs font-semibold text-zinc-400">Trenutna kontrola QR menija:</div>
            <div className="my-3 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
              <div>
                <div className="text-sm font-bold text-white">Craft IPA Pivo 0.5L</div>
                <div className="text-xs text-zinc-400">Cijena: €3.90</div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  soldOut ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {soldOut ? "RASPRODATO" : "DOSTUPNO"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !soldOut;
                setSoldOut(next);
                addLog("Admin", `Craft IPA Pivo označeno kao ${next ? "RASPRODATO" : "DOSTUPNO"}`);
              }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-bold text-zinc-200 transition hover:border-amber-500/50 hover:text-amber-400"
            >
              {soldOut ? "Vrati u prodaju na QR meniju" : "Označi kao „Rasprodato“ na meniju"}
            </button>
          </div>

          {/* Canlı Audit Log Akışı */}
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Audit Log (Posljednje izmjene)</span>
              <span className="h-2 w-2 rounded-full bg-purple-400" />
            </div>
            <div className="space-y-2">
              {auditLogs.map((l, i) => (
                <div key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-2 text-[11px]">
                  <div className="flex justify-between text-zinc-500">
                    <span className="font-semibold text-purple-300">{l.user}</span>
                    <span className="font-mono">{l.time}</span>
                  </div>
                  <div className="mt-0.5 text-zinc-200">{l.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
