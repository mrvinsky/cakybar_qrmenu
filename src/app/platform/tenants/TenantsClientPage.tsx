"use client";

import Link from "next/link";
import { Badge } from "@/components/Shell";
import { CreateTenantForm } from "./CreateTenantForm";
import { useLanguage } from "@/contexts/LanguageContext";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  qrMode: string;
  planName: string | null;
  paymentStatus: string;
  subscriptionEndsAt: string | null;
  userCount: number;
  status: string;
};

export function TenantsClientPage({
  tenants,
  plans,
}: {
  tenants: TenantRow[];
  plans: { id: string; name: string }[];
}) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.tenantsTitle}</h1>
        <span className="text-xs text-zinc-400">
          {tenants.length} {t.totalTenants.toLowerCase()}
        </span>
      </div>

      <CreateTenantForm plans={plans} />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-400">
            <tr className="border-b border-zinc-800">
              <th className="p-3">{t.tableColName}</th>
              <th>{t.tableColSlug}</th>
              <th>{t.tableColQrMode}</th>
              <th>{t.tableColPlan}</th>
              <th>{t.tableColPayment}</th>
              <th>{t.tableColExpires}</th>
              <th>{t.tableColUsers}</th>
              <th>{t.tableColStatus}</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((item) => (
              <tr
                key={item.id}
                className="border-b border-zinc-800/60 hover:bg-zinc-800/30"
              >
                <td className="p-3">
                  <Link
                    href={`/platform/tenants/${item.id}`}
                    className="font-medium hover:text-amber-400"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="text-zinc-400">/{item.slug}</td>
                <td>
                  <Badge
                    tone={item.qrMode === "TABLE_ORDERING" ? "amber" : "zinc"}
                  >
                    {item.qrMode === "TABLE_ORDERING"
                      ? t.qrTableOrdering
                      : t.qrMenuOnly}
                  </Badge>
                </td>
                <td>{item.planName ?? "—"}</td>
                <td>
                  <Badge
                    tone={
                      item.paymentStatus === "PAID"
                        ? "green"
                        : item.paymentStatus === "OVERDUE"
                        ? "red"
                        : "amber"
                    }
                  >
                    {item.paymentStatus}
                  </Badge>
                </td>
                <td>
                  {item.subscriptionEndsAt
                    ? new Date(item.subscriptionEndsAt).toLocaleDateString(
                        lang === "tr" ? "tr-TR" : "sr-Latn"
                      )
                    : "—"}
                </td>
                <td>{item.userCount}</td>
                <td>
                  <Badge tone={item.status === "ACTIVE" ? "green" : "red"}>
                    {item.status === "ACTIVE"
                      ? t.statusActive
                      : t.statusSuspended}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
