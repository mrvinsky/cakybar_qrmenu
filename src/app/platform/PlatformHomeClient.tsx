"use client";

import Link from "next/link";
import { Badge, Stat } from "@/components/Shell";
import { useLanguage } from "@/contexts/LanguageContext";

type ExpiringTenant = {
  id: string;
  name: string;
  subscriptionEndsAt: string;
  expired: boolean;
};

export function PlatformHomeClient({
  tenants,
  active,
  suspended,
  users,
  orders,
  mrrSum,
  paymentsMonth,
  expiring,
}: {
  tenants: number;
  active: number;
  suspended: number;
  users: number;
  orders: number;
  mrrSum: number;
  paymentsMonth: number;
  expiring: ExpiringTenant[];
}) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.platformOverview}</h1>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
          {lang === "tr" ? "🇹🇷 Türkçe Görünüm" : "🇷🇸 Srpski prikaz"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label={t.totalTenants}
          value={tenants}
          hint={`${active} ${t.activeCount} · ${suspended} ${t.suspendedCount}`}
        />
        <Stat
          label={t.estimatedMrr}
          value={`€${mrrSum.toFixed(2)}`}
          hint={t.activeAndPaid}
        />
        <Stat
          label={t.paymentsThisMonth}
          value={`€${paymentsMonth.toFixed(2)}`}
        />
        <Stat
          label={t.usersAndOrders}
          value={`${users} / ${orders}`}
        />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">{t.expiringSubscriptions}</h2>
        {expiring.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.noExpiringSubscriptions}</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {expiring.map((tItem) => (
              <li
                key={tItem.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <Link
                  href={`/platform/tenants/${tItem.id}`}
                  className="hover:text-amber-400 font-medium"
                >
                  {tItem.name}
                </Link>
                <span className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">
                    {new Date(tItem.subscriptionEndsAt).toLocaleDateString(
                      lang === "tr" ? "tr-TR" : "sr-Latn"
                    )}
                  </span>
                  <Badge tone={tItem.expired ? "red" : "amber"}>
                    {tItem.expired ? t.expired : t.soon}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
