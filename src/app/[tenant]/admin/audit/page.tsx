import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TenantAuditPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const logs = await db.auditLog.findMany({
    where: { tenantId: tenant.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log (Trag svih izmjena)</h1>
        <p className="text-sm text-zinc-400">
          Hronološki zapis ko je, kada i koju akciju izvršio u objektu {tenant.name}
        </p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
            <tr>
              <th className="p-3.5">Vrijeme</th>
              <th>Korisnik</th>
              <th>Akcija</th>
              <th>Modul</th>
              <th className="p-3.5">Detalji</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/60">
                <td className="whitespace-nowrap p-3.5 text-xs text-zinc-400">
                  {l.createdAt.toLocaleString("sr-Latn")}
                </td>
                <td className="font-medium text-white">
                  {l.user?.name ?? "Gost / Sistem"}
                </td>
                <td className="font-mono text-xs font-bold text-amber-400">
                  {l.action}
                </td>
                <td className="text-xs text-zinc-400">{l.entity ?? "—"}</td>
                <td className="max-w-md truncate p-3.5 font-mono text-xs text-zinc-500">
                  {l.details ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
