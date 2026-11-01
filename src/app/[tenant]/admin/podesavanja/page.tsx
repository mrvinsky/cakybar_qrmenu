import Link from "next/link";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { Badge } from "@/components/Shell";
import { addTableAction, toggleTableAction } from "@/app/actions/tables";
import { TenantBrandingCard } from "./TenantBrandingCard";

export default async function PodesavanjaStoloviPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const tables = await db.table.findMany({
    where: { tenantId: tenant.id },
    orderBy: { number: "asc" },
  });

  const nextNum = (tables[tables.length - 1]?.number ?? 0) + 1;
  const isTableOrdering = tenant.qrMode === "TABLE_ORDERING";
  const singleMenuPath = `/${slug}/menu`;
  const singleQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `https://baros.app${singleMenuPath}`
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Podešavanja · Stolovi i QR Meni</h1>
            <Badge tone={isTableOrdering ? "amber" : "zinc"}>
              {isTableOrdering ? "Režim: QR + Naručivanje sa stola" : "Režim: Samo digitalni meni"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {isTableOrdering
              ? "Svaki sto ima svoj unikatni QR kod preko kog gosti sami šalju narudžbu."
              : "Vaš objekat koristi jedan jedinstveni QR kod za prikaz cjenovnika, dok narudžbe unose konobari po stolovima."}
          </p>
        </div>
        <Link href={singleMenuPath} target="_blank" className="btn-ghost">
          Otvori javni QR meni ↗
        </Link>
      </div>

      {/* Kafe Logosu ve İletişim Bilgileri (PDF Sipariş Fişleri İçin) */}
      <TenantBrandingCard
        slug={slug}
        tenant={{
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          contactPhone: tenant.contactPhone,
          contactEmail: tenant.contactEmail,
          address: tenant.address,
        }}
      />

      {/* Ako je objekat u MENU_ONLY režimu, prikaži JEDAN glavni QR kod za štampu */}
      {!isTableOrdering && (
        <div className="card flex flex-col items-center gap-6 border-amber-500/40 sm:flex-row">
          <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={singleQrImg} alt="QR Meni" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
              Jedinstveni QR kod menija
            </span>
            <h2 className="text-xl font-bold">{tenant.name} — Digitalni Cjenovnik</h2>
            <p className="max-w-xl text-sm text-zinc-400">
              Odštampajte ovaj QR kod i postavite ga na sve stolove. Gosti skeniranjem vide kompletan meni i cijene, a konobari na svom ekranu otvaraju adiciju po broju stola ispod.
            </p>
            <div className="pt-1 font-mono text-xs text-amber-400">{singleMenuPath}</div>
          </div>
        </div>
      )}

      {/* Yeni Masa Ekleme Formu (Garson ekranı her iki modda da masaları kullanır) */}
      <form
        action={addTableAction.bind(null, slug)}
        className="card grid gap-3 sm:grid-cols-4 sm:items-end"
      >
        <div>
          <label className="label">Broj stola</label>
          <input
            name="number"
            type="number"
            min={1}
            required
            defaultValue={nextNum}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Naziv / Zona (opciono)</label>
          <input
            name="name"
            placeholder="npr. Bašta 1, Šank 2, Separe..."
            className="input"
          />
        </div>
        <button className="btn">+ Dodaj sto</button>
      </form>

      {/* Masa Listesi (TABLE_ORDERING ise her masanın ayrı QR kodu var; MENU_ONLY ise sadece masa kartları) */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((t) => {
          const qrPath = `/${slug}/menu?table=${t.number}`;
          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
            `https://baros.app${qrPath}`
          )}`;

          return (
            <div
              key={t.id}
              className={`card flex flex-col justify-between space-y-3 ${
                !t.active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-extrabold text-amber-400">
                    Sto {t.number}
                  </div>
                  <div className="text-xs text-zinc-400">{t.name}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    t.active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {t.active ? "Aktivan" : "Neaktivan"}
                </span>
              </div>

              {isTableOrdering && (
                <>
                  <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImgUrl}
                      alt={`QR Sto ${t.number}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="truncate text-center font-mono text-[11px] text-zinc-400">
                    {qrPath}
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                {isTableOrdering && (
                  <Link
                    href={qrPath}
                    target="_blank"
                    className="btn-ghost flex-1 text-center text-xs"
                  >
                    Testiraj sto ↗
                  </Link>
                )}
                <form
                  action={toggleTableAction.bind(null, slug, t.id, !t.active)}
                  className="flex-1"
                >
                  <button className="btn-ghost w-full text-xs">
                    {t.active ? "Isključi sto" : "Uključi sto"}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
