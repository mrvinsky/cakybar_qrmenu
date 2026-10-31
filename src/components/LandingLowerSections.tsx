"use client";

import Link from "next/link";
import { useState } from "react";

const FAQS = [
  {
    tag: "QR Meni",
    q: "Da li gosti moraju instalirati aplikaciju ili se registrovati?",
    a: "Ne. Gost samo usmjeri kameru telefona u QR kod na stolu i digitalni meni se otvara u pretraživaču za manje od sekunde. Nema preuzimanja sa App Store-a, nema lozinki niti registracije.",
  },
  {
    tag: "Oprema",
    q: "Da li nam je potreban poseban hardver ili novi POS terminal?",
    a: "Ne. BarOS je moderna PWA (Progressive Web App) platforma koja radi na bilo kom telefonu, tabletu ili laptopu koji već koristite u objektu – iOS, Android, Windows ili Mac.",
  },
  {
    tag: "Konobari",
    q: "Kako konobar ili šanker zna da je stigla nova narudžba sa stola?",
    a: "Čim gost klikne na „Potvrdi narudžbu“, telefon konobara ili tablet u šanku trenutno emituje zvučni signal (zvono) i prikazuje broj stola, artikle i napomenu gosta u realnom vremenu.",
  },
  {
    tag: "Sigurnost & Uloge",
    q: "Mogu li radnici vidjeti finansijske izvještaje, marže i istoriju pazara?",
    a: "Ne. Radnički nalog (Radnik) ima pristup isključivo operativnim funkcijama: narudžbe uživo, slijepi popis (bez uvida u očekivano stanje), prijava nedostatka robe i predaja smjene. Finansije vidi samo Vlasnik (Admin).",
  },
  {
    tag: "Popis & Kalo",
    q: "Kako funkcioniše popis i šta se dešava kada postoji manjak?",
    a: "Radnik na svom telefonu unosi stvarno prebrojano stanje u šanku i magacinu. Admin na svom ekranu odmah vidi poređenje sa očekivanim stanjem, obračunatu razliku u komadima i eurima, te jednim klikom zaključava popis.",
  },
  {
    tag: "Implementacija",
    q: "Koliko traje uvođenje sistema i unos menija?",
    a: "Vaš objekat kreiramo za 2 minuta. Unos kategorija, artikala i generisanje QR kodova za stolove traje oko 10–15 minuta, a naš tim vam može besplatno unijeti kompletan postojeći cjenovnik.",
  },
];

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "dj")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vas-kafic"
  );
}

export function LandingLowerSections({
  cta,
}: {
  cta: { href: string; label: string };
}) {
  // Step 1: Cafe name -> live slug
  const [cafeName, setCafeName] = useState("Caky Bar");
  // Step 2: Selected table QR preview
  const [selectedTable, setSelectedTable] = useState(4);
  // Step 3: Role matrix toggle
  const [roleView, setRoleView] = useState<"ADMIN" | "RADNIK">("ADMIN");
  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number>(0);
  // Demo request form
  const [sentDemo, setSentDemo] = useState(false);

  const slug = slugify(cafeName);

  const permissions = [
    { name: "Narudžbe uživo & zvučna obavještenja", admin: true, radnik: true },
    { name: "Unos popisa i prijava potrošenih artikala", admin: true, radnik: true },
    { name: "Predaja pazara na kraju smjene", admin: true, radnik: true },
    { name: "Uvid u očekivano stanje na popisu i manjak", admin: true, radnik: false },
    { name: "Finansijski izvještaji, marže i istorija pazara", admin: true, radnik: false },
    { name: "Upravljanje cijenama, zaposlenima i Audit Log", admin: true, radnik: false },
  ];

  return (
    <>
      {/* KAKO RADI — İNTERAKTİF 3 ADIM */}
      <section id="kako" className="border-y border-zinc-800/80 bg-zinc-900/20 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
              ⚡ Brza implementacija
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Od registracije do prve narudžbe za 10 minuta
            </h2>
            <p className="mt-3 text-zinc-400">
              Bez tehničkog predznanja i bez komplikovanih instalacija. Isprobajte sva 3 koraka uživo:
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {/* ADIM 01: OBJEKAT & URL */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-7 shadow-xl transition hover:border-amber-500/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 font-mono text-sm font-black text-amber-400">
                    01
                  </span>
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400">
                    Za 60 sekundi
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold">Kreiramo vaš objekat</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Svaki kafić ili bar dobija svoj izolovani prostor, bazu podataka i unikatni web link na platformi.
                </p>
              </div>

              {/* Canlı URL Oluşturucu */}
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Upišite naziv vašeg kafića:
                </label>
                <input
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="npr. Caffe Bar Corso"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-500"
                />
                <div className="mt-3 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-2.5 py-1.5">
                    <span className="text-zinc-500">QR Meni:</span>
                    <span className="text-amber-400">baros.app/{slug}/menu</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-2.5 py-1.5">
                    <span className="text-zinc-500">Admin:</span>
                    <span className="text-emerald-400">baros.app/{slug}/admin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ADIM 02: QR STOLOVI */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-7 shadow-xl transition hover:border-amber-500/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 font-mono text-sm font-black text-amber-400">
                    02
                  </span>
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400">
                    Automatski QR
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold">Postavite stolove i meni</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Unesite broj stolova i sistem odmah generiše QR kartice spremne za štampu. Svaki kod zna tačan broj stola.
                </p>
              </div>

              {/* Canlı QR Önizleyici */}
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex gap-1.5">
                  {[1, 4, 7, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedTable(n)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        selectedTable === n
                          ? "bg-amber-500 text-zinc-950"
                          : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Sto {n}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3.5 rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3">
                  {/* Stilize SVG QR Kod */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 text-zinc-950 shadow">
                    <svg viewBox="0 0 36 36" className="h-full w-full fill-current">
                      <path d="M2 2h10v10H2V2zm2 2v6h6V4H4zm2 2h2v2H6V6zm18-4h10v10H24V2zm2 2v6h6V4h-6zm2 2h2v2h-2V6zM2 24h10v10H2V24zm2 2v6h6v-6H4zm2 2h2v2H6v-2zm10-24h4v4h-4V4zm4 6h4v4h-4v-4zm-6 4h4v4h-4v-4zm8 2h4v4h-4v-4zm-4 6h6v4h-6v-4zm8 4h6v6h-6v-6zm-12 4h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-white">
                      {cafeName || "Vaš Bar"} · Sto {selectedTable}
                    </div>
                    <div className="truncate font-mono text-[11px] text-amber-400">
                      /{slug}/menu?table={selectedTable}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Skeniraj kamerom → Naruči sa stola
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ADIM 03: TIM & RBAC */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-7 shadow-xl transition hover:border-amber-500/40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 font-mono text-sm font-black text-amber-400">
                    03
                  </span>
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400">
                    Pametne dozvole
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold">Podijelite uloge timu</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Konobari dobijaju brz mobilni ekran za rad, dok finansije, marže i istorija ostaju zaključani samo za vas.
                </p>
              </div>

              {/* Canlı Rol Karşılaştırıcı */}
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex gap-1.5 rounded-xl bg-zinc-900 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setRoleView("ADMIN")}
                    className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                      roleView === "ADMIN" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    👔 Vlasnik (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleView("RADNIK")}
                    className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                      roleView === "RADNIK" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    🧑‍🍳 Konobar (Radnik)
                  </button>
                </div>

                <ul className="mt-3 space-y-1.5 text-xs">
                  {permissions.map((p) => {
                    const allowed = roleView === "ADMIN" ? p.admin : p.radnik;
                    return (
                      <li
                        key={p.name}
                        className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-2.5 py-1.5"
                      >
                        <span className={allowed ? "text-zinc-200" : "text-zinc-500 line-through"}>
                          {p.name}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            allowed ? "text-emerald-400" : "text-red-400/80"
                          }`}
                        >
                          {allowed ? "✓ Dostupno" : "🔒 Skriveno"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ČESTA PITANJA (AKORDEON FAQ) */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Česta pitanja
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sve što vas zanima prije početka
          </h2>
          <p className="mt-2 text-zinc-400">
            Kliknite na pitanje za detaljan odgovor o radu sistema u praksi.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition ${
                  isOpen
                    ? "border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900"
                    : "border-zinc-800/90 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
                      {f.tag}
                    </span>
                    <span className="text-base font-bold text-zinc-100">{f.q}</span>
                  </div>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                      isOpen
                        ? "border-amber-500 bg-amber-500 text-zinc-950"
                        : "border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-800/60 px-6 pb-5 pt-3 text-sm leading-relaxed text-zinc-300">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* KONTAKT & DEMO BAŞVURU ALANI */}
      <section id="kontakt" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 p-8 shadow-[0_30px_100px_-20px_rgba(245,158,11,0.22)] md:p-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-12">
            {/* Sol Metin & Avantajlar */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300">
                🚀 14 dana besplatnog probnog perioda
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Spremni da modernizujete svoj kafić ili bar?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                Ostavite podatke vašeg objekta i u roku od nekoliko sati otvaramo vaš BarOS panel sa unešenim stolovima i početnim menijem – potpuno besplatno.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["Besplatni unos", "Mi unosimo vaš prvi cjenovnik"],
                  ["Bez ugovora", "Otkažite u bilo kom trenutku"],
                  ["Podrška 24/7", "Direktan kontakt na telefonu"],
                ].map(([title, sub]) => (
                  <div key={title} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
                    <div className="text-sm font-bold text-amber-400">✓ {title}</div>
                    <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                <span>Već imate otvoren nalog?</span>
                <Link href={cta.href} className="btn-ghost font-semibold text-white">
                  {cta.label} →
                </Link>
              </div>
            </div>

            {/* Sağ Hızlı Demo Formu */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl">
                {sentDemo ? (
                  <div className="space-y-3 py-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
                      ✓
                    </div>
                    <h3 className="text-xl font-bold text-white">Zahtjev je pripremljen!</h3>
                    <p className="text-sm text-zinc-400">
                      Vaš email klijent je otvoren. Možete nam pisati i direktno na{" "}
                      <a href="mailto:info@baros.app" className="text-amber-400 underline">
                        info@baros.app
                      </a>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={() => setSentDemo(false)}
                      className="btn-ghost mt-2 text-xs"
                    >
                      Pošalji novi upit
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const objekat = String(fd.get("objekat") || "");
                      const telefon = String(fd.get("telefon") || "");
                      const stolovi = String(fd.get("stolovi") || "");
                      const subject = encodeURIComponent(`BarOS Demo zahtjev — ${objekat}`);
                      const body = encodeURIComponent(
                        `Objekat: ${objekat}\nKontakt telefon: ${telefon}\nBroj stolova: ${stolovi}`
                      );
                      window.location.href = `mailto:info@baros.app?subject=${subject}&body=${body}`;
                      setSentDemo(true);
                    }}
                    className="space-y-3.5"
                  >
                    <div className="text-base font-extrabold text-white">
                      Zakažite besplatnu prezentaciju
                    </div>
                    <div>
                      <label className="label">Naziv kafića / restorana</label>
                      <input
                        name="objekat"
                        required
                        placeholder="npr. Caky Bar"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Broj telefona (Viber / WhatsApp)</label>
                      <input
                        name="telefon"
                        required
                        placeholder="+387 / +381 / +382 ..."
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Okviran broj stolova</label>
                      <select name="stolovi" className="input">
                        <option value="Do 15 stolova">Do 15 stolova</option>
                        <option value="15 – 35 stolova">15 – 35 stolova</option>
                        <option value="Preko 35 stolova">Preko 35 stolova</option>
                      </select>
                    </div>
                    <button type="submit" className="btn w-full py-3 text-sm font-extrabold shadow-lg shadow-amber-500/20">
                      Zatraži besplatan demo nalog →
                    </button>
                    <p className="text-center text-[11px] text-zinc-500">
                      Direktan kontakt: <a href="mailto:info@baros.app" className="text-zinc-300 hover:text-amber-400">info@baros.app</a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
