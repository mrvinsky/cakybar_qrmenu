import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { HeroDishShowcase } from "@/components/HeroDishShowcase";
import { LandingInteractiveDemo } from "@/components/LandingInteractiveDemo";
import { LandingEcosystemBento } from "@/components/LandingEcosystemBento";
import { LandingLowerSections } from "@/components/LandingLowerSections";

export const dynamic = "force-dynamic";

const metrics = [
  { value: "< 2 min", label: "Postavljanje menija i stolova" },
  { value: "0 €", label: "Dodatni trošak za hardver / POS" },
  { value: "3× brže", label: "Naručivanje i opsluživanje gostiju" },
  { value: "100%", label: "Uvid u zalihe, popis i dnevni pazar" },
];

export default async function Landing() {
  const session = await getSession();
  const cta = session
    ? { href: homeFor(session), label: "Moj panel" }
    : { href: "/login", label: "Prijava" };

  return (
    <div className="min-h-screen selection:bg-amber-500 selection:text-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20">
              B
            </span>
            <span>
              Bar<span className="text-amber-500">OS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#prikaz" className="transition hover:text-white">Uživo prikaz</a>
            <a href="#funkcije" className="transition hover:text-white">Funkcije</a>
            <a href="#kako" className="transition hover:text-white">Kako radi</a>
            <a href="#faq" className="transition hover:text-white">Pitanja</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <a href="#kontakt" className="hidden rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white sm:inline-flex">
              Zatraži demo
            </a>
            <Link href={cta.href} className="btn shadow-lg shadow-amber-500/20">
              {cta.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(245,158,11,0.16),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              SaaS operativni sistem za kafiće, barove i restorane
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Vodite svoj kafić{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                pametnije
              </span>
              , ne teže.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 md:mx-0 md:text-lg">
              Digitalni QR meni, narudžbe sa stola, zvučna obavještenja za konobare, inventar, popis, nabavka i dnevni pazar – sve u jednom modernom sistemu.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href={cta.href} className="btn px-6 py-3 text-base shadow-lg shadow-amber-500/25">
                {cta.label} →
              </Link>
              <a href="#prikaz" className="btn-ghost px-6 py-3 text-base">
                Pogledaj kako radi
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 md:justify-start">
              <span>✓ 14 dana besplatno</span>
              <span>✓ Bez dodatnog hardvera</span>
              <span>✓ Spremno za 10 minuta</span>
            </div>
          </div>

          <HeroDishShowcase />
        </div>
      </section>

      {/* Metrik Şeridi */}
      <section className="border-y border-zinc-800/80 bg-zinc-900/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center md:text-left">
              <div className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
                {m.value}
              </div>
              <div className="mt-1 text-xs text-zinc-400 sm:text-sm">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* İnteraktif Ürün Önizlemesi */}
      <section id="prikaz" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Interaktivni demo
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Doživite protok narudžbe u realnom vremenu
          </h2>
          <p className="mt-3 text-zinc-400">
            Kliknite ispod i pogledajte kako izgleda iskustvo za gosta, konobara i vlasnika objekta.
          </p>
        </div>

        <div className="mt-12">
          <LandingInteractiveDemo />
        </div>
      </section>

      {/* Bento Grid Özellikler */}
      <section id="funkcije" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Kompletan ekosistem
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sve što vašem objektu treba. Ništa suvišno.
          </h2>
          <p className="mt-3 text-zinc-400">
            Dizajniran sa vlasnicima barova i konobarima kako bi eliminisao papirne blokove, greške u šanku i manjak u magacinu.
          </p>
        </div>

        <LandingEcosystemBento />
      </section>

      <LandingLowerSections cta={cta} />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2 font-bold text-zinc-300">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-xs font-black text-zinc-950">
              B
            </span>
            BarOS Platforma
          </div>
          <div className="flex gap-6">
            <a href="#prikaz" className="hover:text-zinc-300">Demo</a>
            <a href="#funkcije" className="hover:text-zinc-300">Funkcije</a>
            <Link href="/login" className="hover:text-zinc-300">Prijava</Link>
          </div>
          <div>© {new Date().getFullYear()} BarOS. Sva prava zadržana.</div>
        </div>
      </footer>
    </div>
  );
}
