import { db } from "@/lib/db";

export default async function PlatformAudit() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, tenant: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log (sve)</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-400">
            <tr className="border-b border-zinc-800"><th className="p-3">Vrijeme</th><th>Objekat</th><th>Korisnik</th><th>Akcija</th><th>Detalji</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/60">
                <td className="p-3 whitespace-nowrap text-zinc-400">{l.createdAt.toLocaleString("sr-Latn")}</td>
                <td>{l.tenant?.name ?? "Platforma"}</td>
                <td>{l.user?.name ?? "—"}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td className="max-w-xs truncate text-xs text-zinc-500">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
