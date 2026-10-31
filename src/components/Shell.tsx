import Link from "next/link";
import { logoutAction, stopImpersonation } from "@/app/actions/auth";
import { ChangePasswordModal } from "./ChangePasswordModal";
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
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-zinc-800 bg-zinc-900/80 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="p-4">
          <div className="text-lg font-bold text-amber-500">{title}</div>
          <div className="text-xs text-zinc-500">{session.name}</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-zinc-800">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 p-4">
          <ChangePasswordModal />
          <form action={logoutAction}>
            <button className="btn-ghost w-full text-xs">Odjava</button>
          </form>
        </div>
      </aside>
      <main className="flex-1">
        {session.imp && (
          <form action={stopImpersonation} className="flex items-center justify-between gap-2 bg-fuchsia-700 px-4 py-2 text-sm">
            <span>Podrška: prijavljeni ste kao korisnik ovog objekta.</span>
            <button className="rounded bg-white/20 px-3 py-1 font-semibold">Vrati se na platformu</button>
          </form>
        )}
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "green" | "red" | "amber" | "zinc" }) {
  const c = {
    green: "bg-emerald-500/15 text-emerald-400",
    red: "bg-red-500/15 text-red-400",
    amber: "bg-amber-500/15 text-amber-400",
    zinc: "bg-zinc-700/40 text-zinc-300",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}
