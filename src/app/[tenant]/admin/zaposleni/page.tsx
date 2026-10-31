import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import {
  createStaffUserAction,
  resetStaffPasswordAction,
  toggleStaffActiveAction,
} from "@/app/actions/operations";
import { Badge } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function AdminZaposleniPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);

  const users = await db.user.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zaposleni ({users.length})</h1>
        <p className="text-sm text-zinc-400">
          Dodajte nove radnike ili administratore, promijenite im lozinku ili privremeno zamrznite pristup
        </p>
      </div>

      {/* Yeni Çalışan Ekleme Formu */}
      <form
        action={createStaffUserAction.bind(null, slug)}
        className="card grid gap-3 sm:grid-cols-5 sm:items-end"
      >
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
            placeholder="Najmanje 6 znakova"
            className="input"
          />
        </div>
        <div>
          <label className="label">Uloga *</label>
          <select name="role" defaultValue="RADNIK" className="input">
            <option value="RADNIK">Radnik / Konobar (bez finansija)</option>
            <option value="ADMIN">Admin objekta (puni pristup)</option>
          </select>
        </div>
        <button className="btn">+ Dodaj zaposlenog</button>
      </form>

      {/* Çalışan Listesi */}
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((u) => {
          const isMe = u.id === session.uid;
          return (
            <div key={u.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {u.name} {isMe && <span className="text-xs text-amber-400">(Vi)</span>}
                  </div>
                  <div className="text-xs text-zinc-400">{u.email}</div>
                </div>
                <div className="flex gap-1.5">
                  <Badge tone={u.role === "ADMIN" ? "amber" : "zinc"}>
                    {u.role}
                  </Badge>
                  <Badge tone={u.active ? "green" : "red"}>
                    {u.active ? "Aktivan" : "Zamrznut"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                {/* Şifre Değiştirme */}
                <form
                  action={resetStaffPasswordAction.bind(null, slug, u.id)}
                  className="flex flex-1 gap-2"
                >
                  <input
                    name="newPassword"
                    type="password"
                    minLength={6}
                    required
                    placeholder="Nova lozinka (min 6)..."
                    className="input h-8 text-xs"
                  />
                  <button className="btn-ghost whitespace-nowrap text-xs">
                    Promijeni lozinku
                  </button>
                </form>

                {/* Hesap Dondurma / Aktifleştirme */}
                {!isMe && (
                  <form
                    action={toggleStaffActiveAction.bind(
                      null,
                      slug,
                      u.id,
                      !u.active
                    )}
                  >
                    <button
                      className={
                        u.active ? "btn-danger text-xs" : "btn text-xs"
                      }
                    >
                      {u.active ? "Zamrzni nalog" : "Aktiviraj nalog"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
