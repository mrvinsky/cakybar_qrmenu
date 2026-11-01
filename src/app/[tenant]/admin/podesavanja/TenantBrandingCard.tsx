"use client";

import { useState } from "react";
import { updateTenantBrandingAction } from "@/app/actions/tables";

export function TenantBrandingCard({
  slug,
  tenant,
}: {
  slug: string;
  tenant: {
    name: string;
    logoUrl: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    address: string | null;
  };
}) {
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [saved, setSaved] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 260;
        let w = img.width;
        let h = img.height;
        if (w > h && w > max) {
          h = Math.round((h * max) / w);
          w = max;
        } else if (h > max) {
          w = Math.round((w * max) / h);
          h = max;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setLogoUrl(canvas.toDataURL("image/png"));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      action={async (fd) => {
        fd.set("logoUrl", logoUrl);
        await updateTenantBrandingAction(slug, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }}
      className="card space-y-4 border-amber-500/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white">
            🏷️ Identitet objekta i Logo za PDF narudžbenice
          </h2>
          <p className="text-xs text-zinc-400">
            Logo, adresa i telefon vašeg kafića pojavljuju se u zaglavlju svake PDF narudžbenice koju šaljete dobavljačima na WhatsApp ili Viber.
          </p>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
            ✓ Sačuvano
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-12 md:items-center">
        {/* Logo önizleme + dosya seçici */}
        <div className="flex items-center gap-4 md:col-span-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 p-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenant.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-500 text-xl font-black text-zinc-950">
                {tenant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="label">Otpremi logo (PNG / JPG)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-zinc-950 hover:file:bg-amber-400"
            />
            <div className="flex gap-2">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Ili unesite URL slike logotipa..."
                className="input h-8 text-xs"
              />
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="btn-ghost h-8 px-2.5 text-xs text-red-400"
                >
                  Ukloni
                </button>
              )}
            </div>
          </div>
        </div>

        {/* İletişim ve Adres Bilgileri */}
        <div className="grid gap-3 sm:grid-cols-3 md:col-span-7">
          <div>
            <label className="label">Telefon objekta</label>
            <input
              name="contactPhone"
              defaultValue={tenant.contactPhone ?? ""}
              placeholder="+381 64 123 4567"
              className="input"
            />
          </div>
          <div>
            <label className="label">Email objekta</label>
            <input
              name="contactEmail"
              type="email"
              defaultValue={tenant.contactEmail ?? ""}
              placeholder="kontakt@cakybar.rs"
              className="input"
            />
          </div>
          <div>
            <label className="label">Adresa objekta</label>
            <input
              name="address"
              defaultValue={tenant.address ?? ""}
              placeholder="Glavna ulica 12, Beograd"
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn text-xs">Sačuvaj podatke i logo objekta →</button>
      </div>
    </form>
  );
}
