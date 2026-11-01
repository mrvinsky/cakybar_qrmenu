"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction, stopImpersonation } from "@/app/actions/auth";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { PwaNotificationControls } from "./PwaNotificationControls";
import type { Session } from "@/lib/jwt";

export type NavItem = { href: string; label: string };

export function Shell({
  title,
  nav,
  session,
  children,
}: {
  title: string;
  nav: NavItem[];
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur md:static md:min-h-screen md:w-64 md:border-b-0 md:border-r md:bg-zinc-900/80">
        <div className="flex items-center justify-between p-3 md:block md:p-4">
          <div>
            <div className="text-lg font-bold text-amber-500">{title}</div>
            <div className="text-xs text-zinc-500">{session.name}</div>
          </div>
          <div className="md:hidden">
            <form action={logoutAction}>
              <button className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white">
                Odjava
              </button>
            </form>
          </div>
        </div>

        {/* Mobil & Masaüstü Gezinme Menüsü */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-1 scrollbar-none md:flex-col md:px-2 md:pb-2">
          {nav.map((n) => {
            // Tam eşleşme veya alt yol kontrolü
            const isActive =
              pathname === n.href ||
              (n.href.split("/").length > 2 &&
                pathname.startsWith(`${n.href}/`));

            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition md:shrink md:rounded-lg md:text-sm ${
                  isActive
                    ? "border border-amber-500/50 bg-amber-500 text-zinc-950 shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]"
                    : "border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-200"
                }`}
              >
                {/* Mobilde aktif olduğunu belirginleştiren parlak nokta */}
                {isActive && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-zinc-950 md:hidden" />
                )}
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Alt Araçlar (PWA, Şifre Değiştirme, Çıkış) */}
        <div className="hidden space-y-2 p-4 md:block">
          <PwaNotificationControls />
          <ChangePasswordModal />
          <form action={logoutAction}>
            <button className="btn-ghost w-full text-xs">Odjava</button>
          </form>
        </div>
      </aside>

      <main className="flex-1">
        {session.imp && (
          <form
            action={stopImpersonation}
            className="flex items-center justify-between gap-2 bg-fuchsia-700 px-4 py-2 text-sm text-white"
          >
            <span>Podrška: prijavljeni ste kao korisnik ovog objekta.</span>
            <button className="rounded bg-white/20 px-3 py-1 font-semibold hover:bg-white/30">
              Vrati se na platformu
            </button>
          </form>
        )}
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "amber" | "zinc";
}) {
  const c = {
    green: "bg-emerald-500/15 text-emerald-400",
    red: "bg-red-500/15 text-red-400",
    amber: "bg-amber-500/15 text-amber-400",
    zinc: "bg-zinc-700/40 text-zinc-300",
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>
      {children}
    </span>
  );
}
