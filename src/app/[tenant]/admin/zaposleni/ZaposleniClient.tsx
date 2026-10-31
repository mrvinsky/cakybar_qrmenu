"use client";

import { useState } from "react";
import {
  createStaffUserAction,
  deleteStaffUserAction,
  resetStaffPasswordAction,
  toggleStaffActiveAction,
  updateStaffUserAction,
} from "@/app/actions/operations";
import { Badge } from "@/components/Shell";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "RADNIK";
  active: boolean;
  createdAt: string;
};

export function ZaposleniClient({
  slug,
  currentUserId,
  users,
}: {
  slug: string;
  currentUserId: string;
  users: StaffUser[];
}) {
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [pwBanner, setPwBanner] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zaposleni & Konobari ({users.length})</h1>
        <p className="text-sm text-zinc-400">
          Dodajte konobare/radnike, uredite njihove podatke, promijenite lozinku, zamrznite ili obrišite nalog
        </p>
      </div>

      {pwBanner && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300">
          ✓ {pwBanner}
        </div>
      )}

      {/* Yeni Garson / Çalışan Ekleme Formu */}
      <form
        action={async (fd) => {
          setCreateError(null);
          const res = await createStaffUserAction(slug, fd);
          if (res && "error" in res && res.error) {
            setCreateError(res.error);
          } else {
            setPwBanner("Novi zaposleni je uspješno dodat!");
            setTimeout(() => setPwBanner(null), 3500);
          }
        }}
        className="card space-y-3"
      >
        <h2 className="text-sm font-bold text-zinc-200">+ Dodaj novog konobara / zaposlenog</h2>
        <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
          <div>
            <label className="label">Ime i prezime *</label>
            <input
              name="name"
              required
              placeholder="npr. Stefan Nikolić"
              className="input"
            />
          </div>
          <div>
            <label className="label">Email za prijavu *</label>
            <input
              name="email"
              type="email"
              required
              placeholder="stefan@caky.com"
              className="input"
            />
          </div>
          <div>
            <label className="label">Početna lozinka *</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min 6 znakova"
              className="input"
            />
          </div>
          <div>
            <label className="label">Uloga *</label>
            <select name="role" defaultValue="RADNIK" className="input">
              <option value="RADNIK">Konobar / Radnik</option>
              <option value="ADMIN">Admin objekta</option>
            </select>
          </div>
          <button className="btn">+ Dodaj zaposlenog</button>
        </div>
        {createError && <p className="text-xs text-red-400">{createError}</p>}
      </form>

      {/* Çalışan Kartları */}
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((u) => {
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id} className="card flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {u.name}{" "}
                    {isMe && <span className="text-xs text-amber-400">(Vi)</span>}
                  </div>
                  <div className="text-xs text-zinc-400">{u.email}</div>
                </div>
                <div className="flex gap-1.5">
                  <Badge tone={u.role === "ADMIN" ? "amber" : "zinc"}>
                    {u.role === "ADMIN" ? "Admin" : "Konobar / Radnik"}
                  </Badge>
                  <Badge tone={u.active ? "green" : "red"}>
                    {u.active ? "Aktivan" : "Zamrznut"}
                  </Badge>
                </div>
              </div>

              {/* Hızlı Şifre Değiştirme */}
              <form
                action={async (fd) => {
                  await resetStaffPasswordAction(slug, u.id, fd);
                  setPwBanner(`Lozinka za ${u.name} je promijenjena.`);
                  setTimeout(() => setPwBanner(null), 3500);
                }}
                className="flex gap-2 border-t border-zinc-800/80 pt-3"
              >
                <input
                  name="newPassword"
                  type="password"
                  minLength={6}
                  required
                  placeholder="Nova lozinka (min 6)..."
                  className="input h-8 flex-1 text-xs"
                />
                <button className="btn-ghost whitespace-nowrap text-xs">
                  🔑 Promijeni lozinku
                </button>
              </form>

              {/* Düzenle / Dondur / Sil Butonları */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditError(null);
                    setEditing(u);
                  }}
                  className="btn-ghost text-xs"
                >
                  ✏️ Uredi podatke / ulogu
                </button>

                {!isMe && (
                  <div className="flex gap-2">
                    <form
                      action={toggleStaffActiveAction.bind(
                        null,
                        slug,
                        u.id,
                        !u.active
                      )}
                    >
                      <button className="btn-ghost text-xs">
                        {u.active ? "⏸ Zamrzni" : "▶ Aktiviraj"}
                      </button>
                    </form>

                    <form action={deleteStaffUserAction.bind(null, slug, u.id)}>
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (
                            !confirm(
                              `Da li ste sigurni da želite trajno obrisati nalog „${u.name}“?`
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                        className="btn-danger text-xs"
                      >
                        🗑 Obriši
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Garson / Çalışan Düzenleme Modalı */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            action={async (fd) => {
              setEditError(null);
              const res = await updateStaffUserAction(slug, fd);
              if (res && "error" in res && res.error) {
                setEditError(res.error);
              } else {
                setEditing(null);
                setPwBanner("Podaci zaposlenog su ažurirani!");
                setTimeout(() => setPwBanner(null), 3500);
              }
            }}
            className="card w-full max-w-md space-y-3.5 border-zinc-700 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-base font-bold">Uredi: {editing.name}</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input type="hidden" name="id" value={editing.id} />

            <div>
              <label className="label">Ime i prezime *</label>
              <input
                name="name"
                required
                defaultValue={editing.name}
                className="input"
              />
            </div>

            <div>
              <label className="label">Email za prijavu *</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={editing.email}
                className="input"
              />
            </div>

            <div>
              <label className="label">Uloga *</label>
              <select
                name="role"
                defaultValue={editing.role}
                disabled={editing.id === currentUserId}
                className="input"
              >
                <option value="RADNIK">Konobar / Radnik (bez finansija)</option>
                <option value="ADMIN">Admin objekta (puni pristup)</option>
              </select>
            </div>

            <div>
              <label className="label">
                Nova lozinka (ostavite prazno ako ne mijenjate)
              </label>
              <input
                name="newPassword"
                type="password"
                minLength={6}
                placeholder="Najmanje 6 znakova..."
                className="input"
              />
            </div>

            {editError && <p className="text-xs text-red-400">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-ghost text-xs"
              >
                Otkaži
              </button>
              <button className="btn text-xs">Sačuvaj izmjene</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
