"use client";

import { useState } from "react";
import { saveSupplierAction, toggleSupplierAction } from "@/app/actions/catalog";
import { Badge } from "@/components/Shell";

type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  products: { id: string; name: string; costPrice: number }[];
  _count: { purchases: number };
};

export function SuppliersClient({
  slug,
  suppliers,
}: {
  slug: string;
  suppliers: Supplier[];
}) {
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);

  const openModal = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dobavljači ({suppliers.length})</h1>
          <p className="text-sm text-zinc-400">
            Upravljajte kontaktima dobavljača i povezanim artiklima za nabavku
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="btn"
        >
          + Novi dobavljač
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-sm text-zinc-400">Još niste dodali nijednog dobavljača.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className={`card flex flex-col justify-between space-y-4 ${
                !s.active ? "opacity-55" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{s.name}</h2>
                    {s.contactPerson && (
                      <p className="text-xs text-amber-400">👤 {s.contactPerson}</p>
                    )}
                  </div>
                  <Badge tone={s.active ? "green" : "red"}>
                    {s.active ? "Aktivan" : "Arhiviran"}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-300">
                  {s.phone && <div>📞 {s.phone}</div>}
                  {s.email && <div>✉️ {s.email}</div>}
                  {s.address && <div>📍 {s.address}</div>}
                  {s.notes && (
                    <div className="mt-2 rounded-lg bg-zinc-950/70 p-2 text-zinc-400">
                      💬 {s.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-zinc-800/80 pt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Povezani artikli ({s.products.length}) · Nabavki ({s._count.purchases})
                  </div>
                  {s.products.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.products.slice(0, 5).map((p) => (
                        <span
                          key={p.id}
                          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300"
                        >
                          {p.name}
                        </span>
                      ))}
                      {s.products.length > 5 && (
                        <span className="text-[11px] text-zinc-500">
                          +{s.products.length - 5} više
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(s);
                  }}
                  className="btn-ghost flex-1 text-xs"
                >
                  Uredi podatke
                </button>
                <form action={toggleSupplierAction.bind(null, slug, s.id, !s.active)}>
                  <button className="btn-ghost text-xs">
                    {s.active ? "Arhiviraj" : "Aktiviraj"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ekleme / Düzenleme Modalı */}
      {openModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            action={async (fd) => {
              await saveSupplierAction(slug, fd);
              setCreating(false);
              setEditing(null);
            }}
            className="card w-full max-w-lg space-y-3.5 border-zinc-700 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">
                {editing ? `Uredi: ${editing.name}` : "Novi dobavljač"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Zatvori ✕
              </button>
            </div>

            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Naziv firme *</label>
                <input
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  placeholder="npr. Coca-Cola HBC / Diskont Pića"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Kontakt osoba</label>
                <input
                  name="contactPerson"
                  defaultValue={editing?.contactPerson ?? ""}
                  placeholder="npr. Nikola"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input
                  name="phone"
                  defaultValue={editing?.phone ?? ""}
                  placeholder="+387 / +381 ..."
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Adresa</label>
                <input
                  name="address"
                  defaultValue={editing?.address ?? ""}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Napomene (dani isporuke, rabat...)</label>
                <input
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  placeholder="npr. Isporuka utorkom i petkom ujutru"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="btn-ghost"
              >
                Otkaži
              </button>
              <button className="btn">Sačuvaj dobavljača</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
