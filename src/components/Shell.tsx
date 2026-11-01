"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction, stopImpersonation } from "@/app/actions/auth";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { PwaNotificationControls } from "./PwaNotificationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Session } from "@/lib/jwt";

export type NavItem = { href: string; label: string; key?: string };

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  // Super Admin panelinde dinamik dil çevirisi
  const getNavLabel = (item: NavItem) => {
    if (!isSuperAdmin) return item.label;
    if (item.href === "/platform") return t.overview;
    if (item.href === "/platform/tenants") return t.tenants;
    if (item.href === "/platform/plans") return t.plans;
    if (item.href === "/platform/audit") return t.auditLog;
    return item.label;
  };

  return (
    <div className="min-h-screen md:flex">
      {/* Üst / Yan Navigasyon */}
      <aside className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur md:static md:min-h-screen md:w-64 md:border-b-0 md:border-r md:bg-zinc-900/80">
        <div className="flex items-center justify-between p-3.5 md:block md:p-4">
          <div>
            <div className="text-lg font-bold text-amber-500">
              {isSuperAdmin ? t.platformTitle : title}
            </div>
            <div className="text-xs text-zinc-500">{session.name}</div>
          </div>

          {/* Mobilde Hamburger Butonu + Dil İndikatörü */}
          <div className="flex items-center gap-2 md:hidden">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setLang(lang === "tr" ? "sr" : "tr")}
                className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-400"
              >
                <span>{lang === "tr" ? "🇹🇷 TR" : "🇷🇸 SR"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Masaüstü Navigasyonu + Mobilde Yatay Hızlı Kaydırma */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-1 scrollbar-none md:flex-col md:px-2 md:pb-2">
          {nav.map((n) => {
            const isActive =
              pathname === n.href ||
              (n.href.split("/").length > 2 &&
                pathname.startsWith(`${n.href}/`));

            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition md:shrink md:rounded-lg md:text-sm ${
                  isActive
                    ? "border border-amber-500/50 bg-amber-500 text-zinc-950 shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]"
                    : "border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-zinc-950 md:hidden" />
                )}
                {getNavLabel(n)}
              </Link>
            );
          })}
        </nav>

        {/* Mobil Açılır Hamburger Menü Çekmecesi */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-800 bg-zinc-950/98 p-4 space-y-4 md:hidden">
            {isSuperAdmin && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-2">
                <div className="text-xs font-bold text-zinc-400">🌐 {t.language}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLang("tr");
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg py-2 text-xs font-bold transition ${
                      lang === "tr"
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    🇹🇷 {t.turkish}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLang("sr");
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg py-2 text-xs font-bold transition ${
                      lang === "sr"
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    🇷🇸 {t.serbian}
                  </button>
                </div>
              </div>
            )}

            <PwaNotificationControls />
            <ChangePasswordModal />

            <form action={logoutAction}>
              <button className="btn-ghost w-full py-2.5 text-xs text-red-400">
                {t.logout}
              </button>
            </form>
          </div>
        )}

        {/* Masaüstü Sol Alt Araçlar */}
        <div className="hidden space-y-3 p-4 md:block">
          {isSuperAdmin && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                <span>🌐 {t.language}</span>
                <span className="text-[10px] text-amber-500 font-mono">
                  {lang.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLang("tr")}
                  className={`rounded-md py-1.5 text-xs font-bold transition ${
                    lang === "tr"
                      ? "bg-amber-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  🇹🇷 TR
                </button>
                <button
                  type="button"
                  onClick={() => setLang("sr")}
                  className={`rounded-md py-1.5 text-xs font-bold transition ${
                    lang === "sr"
                      ? "bg-amber-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  🇷🇸 SR
                </button>
              </div>
            </div>
          )}

          <PwaNotificationControls />
          <ChangePasswordModal />
          <form action={logoutAction}>
            <button className="btn-ghost w-full text-xs">{t.logout}</button>
          </form>
        </div>
      </aside>

      {/* Ana Gövde */}
      <main className="flex-1">
        {session.imp && (
          <form
            action={stopImpersonation}
            className="flex items-center justify-between gap-2 bg-fuchsia-700 px-4 py-2 text-sm text-white"
          >
            <span>{t.supportBanner}</span>
            <button className="rounded bg-white/20 px-3 py-1 font-semibold hover:bg-white/30">
              {t.returnToPlatform}
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
