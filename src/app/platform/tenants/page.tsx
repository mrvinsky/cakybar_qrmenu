import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/Shell";
import { CreateTenantForm } from "./CreateTenantForm";

export default async function TenantsPage() {
  const [tenants, plans] = await Promise.all([
    db.tenant.findMany({
      include: { plan: true, _count: { select: { users: true, tables: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.plan.findMany({ where: { active: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Objekti</h1>
      <CreateTenantForm plans={plans.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-400">
            <tr className="border-b border-zinc-800">
              <th className="p-3">Naziv</th><th>Slug</th><th>QR Režim</th><th>Plan</th><th>Plaćanje</th>
              <th>Ističe</th><th>Korisnici</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                <td className="p-3"><Link href={`/platform/tenants/${t.id}`} className="font-medium hover:text-amber-400">{t.name}</Link></td>
                <td className="text-zinc-400">/{t.slug}</td>
                <td>
                  <Badge tone={t.qrMode === "TABLE_ORDERING" ? "amber" : "zinc"}>
                    {t.qrMode === "TABLE_ORDERING" ? "Naručivanje sa stola" : "Samo meni"}
                  </Badge>
                </td>
                <td>{t.plan?.name ?? "—"}</td>
                <td><Badge tone={t.paymentStatus === "PAID" ? "green" : t.paymentStatus === "OVERDUE" ? "red" : "amber"}>{t.paymentStatus}</Badge></td>
                <td>{t.subscriptionEndsAt?.toLocaleDateString("sr-Latn") ?? "—"}</td>
                <td>{t._count.users}</td>
                <td><Badge tone={t.status === "ACTIVE" ? "green" : "red"}>{t.status === "ACTIVE" ? "Aktivan" : "Suspendovan"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
