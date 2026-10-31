import Link from "next/link";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { Badge, Stat } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function MojRad({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);
  const b = `/${slug}/radnik`;

  const [activeOrders, openPopis, openNeeds] = await Promise.all([
    db.order.count({
      where: { tenantId: tenant.id, status: { in: ["PENDING", "PREPARING", "SERVED"] } },
    }),
    db.stockCount.findFirst({
      where: { tenantId: tenant.id, status: "OPEN" },
    }),
    db.needReport.count({
      where: { tenantId: tenant.id, resolved: false },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zdravo, {session.name} 👋</h1>
        <p className="text-sm text-zinc-400">
          Brzi pregled vaše smjene u objektu <strong>{tenant.name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Aktivne narudžbe" value={activeOrders} hint="Stolovi u radu" />
        <Stat
          label="Status popisa"
          value={
            <Badge tone={openPopis ? "green" : "zinc"}>
              {openPopis ? "🟢 Otvoren za unos" : "Nema otvorenog popisa"}
            </Badge>
          }
        />
        <Stat label="Prijavljene potrebe" value={openNeeds} hint="Čeka nabavku" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`${b}/narudzbe`}
          className="card transition hover:border-amber-500/50"
        >
          <div className="text-2xl">🔔</div>
          <h2 className="mt-2 font-bold">Narudžbe uživo & Stolovi</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Primajte QR narudžbe sa stolova ili sami otvorite novu narudžbu za sto.
          </p>
        </Link>

        <Link
          href={`${b}/popis`}
          className="card transition hover:border-amber-500/50"
        >
          <div className="text-2xl">📋</div>
          <h2 className="mt-2 font-bold">Unos popisa</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Brzo mobilno brojanje artikala u šanku i magacinu.
          </p>
        </Link>

        <Link
          href={`${b}/prijava`}
          className="card transition hover:border-amber-500/50"
        >
          <div className="text-2xl">⚠️</div>
          <h2 className="mt-2 font-bold">Prijavi nedostatak robe</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Označi artikle koji su „Pri kraju“, „Nedostaje“ ili „Hitno“.
          </p>
        </Link>

        <Link
          href={`${b}/pazar`}
          className="card transition hover:border-amber-500/50"
        >
          <div className="text-2xl">💶</div>
          <h2 className="mt-2 font-bold">Zatvori smjenu (Pazar)</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Predaja gotovine i kartica na kraju I ili II smjene.
          </p>
        </Link>
      </div>
    </div>
  );
}
