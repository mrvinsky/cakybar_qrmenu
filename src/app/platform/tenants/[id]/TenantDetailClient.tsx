"use client";

import { Badge, Stat } from "@/components/Shell";
import {
  addPayment,
  impersonate,
  platformCreateTenantUser,
  platformDeleteTenantUser,
  platformUpdateTenantUser,
  setTenantStatus,
  updateTenantPlan,
} from "@/app/actions/platform";
import { useLanguage } from "@/contexts/LanguageContext";

const d = (x?: string | null) => (x ? x.slice(0, 10) : "");

type TenantData = {
  id: string;
  name: string;
  slug: string;
  status: string;
  qrMode: string;
  planId: string | null;
  paymentStatus: string;
  subscriptionEndsAt: string | null;
  createdAt: string;
  plan: { id: string; name: string } | null;
  payments: { id: string; periodStart: string; periodEnd: string; amount: number }[];
  users: { id: string; name: string; email: string; role: string; active: boolean }[];
  _count: { tables: number; products: number; orders: number };
};

type PlanData = {
  id: string;
  name: string;
  priceMonthly: number;
};

export function TenantDetailClient({
  tenant: t,
  plans,
}: {
  tenant: TenantData;
  plans: PlanData[];
}) {
  const { t: tr, lang } = useLanguage();
  const active = t.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.name}</h1>
          <p className="text-sm text-zinc-400">
            /{t.slug} · {new Date(t.createdAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "sr-Latn")}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={impersonate.bind(null, t.id)}>
            <button className="btn-ghost">{tr.loginAsAdmin}</button>
          </form>
          <form action={setTenantStatus.bind(null, t.id, active ? "SUSPENDED" : "ACTIVE")}>
            <button className={active ? "btn-danger" : "btn"}>
              {active ? tr.suspendTenant : tr.activateTenant}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label={tr.tableColStatus}
          value={
            <Badge tone={active ? "green" : "red"}>
              {active ? tr.statusActive : tr.statusSuspended}
            </Badge>
          }
        />
        <Stat label={tr.tablesCount} value={t._count.tables} />
        <Stat label={tr.productsCount} value={t._count.products} />
        <Stat label={tr.ordersCount} value={t._count.orders} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pretplata i Režim rada */}
        <form action={updateTenantPlan.bind(null, t.id)} className="card space-y-3">
          <h2 className="font-semibold">{tr.subscriptionAndMode}</h2>
          <div>
            <label className="label">{tr.qrModeLabel}</label>
            <select name="qrMode" defaultValue={t.qrMode} className="input">
              <option value="TABLE_ORDERING">{tr.formQrOptionTable}</option>
              <option value="MENU_ONLY">{tr.formQrOptionMenu}</option>
            </select>
          </div>
          <div>
            <label className="label">{tr.formPlan}</label>
            <select name="planId" defaultValue={t.planId ?? ""} className="input">
              <option value="">{tr.formNoPlan}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (€{p.priceMonthly}/ay)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{tr.paymentStatus}</label>
            <select name="paymentStatus" defaultValue={t.paymentStatus} className="input">
              <option value="TRIAL">TRIAL</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          <div>
            <label className="label">{tr.validUntil}</label>
            <input
              type="date"
              name="subscriptionEndsAt"
              defaultValue={d(t.subscriptionEndsAt)}
              className="input"
            />
          </div>
          <button className="btn">{tr.save}</button>
        </form>

        {/* Manuel Ödeme Kaydı */}
        <form action={addPayment.bind(null, t.id)} className="card space-y-3">
          <h2 className="font-semibold">{tr.recordPayment}</h2>
          <div>
            <label className="label">{tr.amountEur}</label>
            <input name="amount" type="number" step="0.01" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">{tr.periodStart}</label>
              <input type="date" name="periodStart" required className="input" />
            </div>
            <div>
              <label className="label">{tr.periodEnd}</label>
              <input type="date" name="periodEnd" required className="input" />
            </div>
          </div>
          <div>
            <label className="label">{tr.method}</label>
            <select name="method" className="input">
              <option value="BANK">{tr.methodBank}</option>
              <option value="CASH">{tr.methodCash}</option>
              <option value="CARD">{tr.methodCard}</option>
              <option value="OTHER">{tr.methodOther}</option>
            </select>
          </div>
          <button className="btn">{tr.recordPaymentBtn}</button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* İşletme Kullanıcıları */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="font-semibold">{tr.tenantUsers}</h2>
            <span className="text-xs text-zinc-400">
              {t.users.length} {tr.tableColUsers.toLowerCase()}
            </span>
          </div>

          <form
            action={platformCreateTenantUser.bind(null, t.id)}
            className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:grid-cols-5"
          >
            <span className="text-xs font-bold text-amber-400 sm:col-span-5">
              {tr.addUser}
            </span>
            <input name="name" required placeholder="Ime / Adı" className="input h-8 text-xs sm:col-span-2" />
            <input name="email" type="email" required placeholder="Email" className="input h-8 text-xs sm:col-span-2" />
            <select name="role" defaultValue="RADNIK" className="input h-8 text-xs">
              <option value="RADNIK">RADNIK (Garson)</option>
              <option value="ADMIN">ADMIN (Yönetici)</option>
            </select>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Şifre"
              className="input h-8 text-xs sm:col-span-3"
            />
            <button className="btn h-8 text-xs sm:col-span-2">{tr.addUser}</button>
          </form>

          <div className="divide-y divide-zinc-800 text-sm">
            {t.users.map((u) => (
              <div key={u.id} className="py-3 space-y-2">
                <form
                  action={platformUpdateTenantUser.bind(null, t.id, u.id)}
                  className="grid gap-2 sm:grid-cols-4 sm:items-center"
                >
                  <input name="name" defaultValue={u.name} className="input h-8 text-xs font-medium" />
                  <input name="email" type="email" defaultValue={u.email} className="input h-8 text-xs" />
                  <select name="role" defaultValue={u.role} className="input h-8 text-xs">
                    <option value="ADMIN">ADMIN</option>
                    <option value="RADNIK">RADNIK</option>
                  </select>
                  <select name="active" defaultValue={u.active ? "true" : "false"} className="input h-8 text-xs">
                    <option value="true">{tr.userActive}</option>
                    <option value="false">{tr.userFrozen}</option>
                  </select>
                  <input
                    name="newPassword"
                    type="password"
                    minLength={6}
                    placeholder="Yeni Şifre (İsteğe bağlı)"
                    className="input h-8 text-xs sm:col-span-3"
                  />
                  <button className="btn h-8 text-xs">{tr.save}</button>
                </form>
                <form action={platformDeleteTenantUser.bind(null, t.id, u.id)} className="flex justify-end">
                  <button className="text-xs text-red-400 hover:underline">
                    {tr.deleteUser}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Ödeme Geçmişi */}
        <div className="card">
          <h2 className="mb-3 font-semibold">{tr.paymentHistory}</h2>
          {t.payments.length === 0 ? (
            <p className="text-sm text-zinc-500">{tr.noPayments}</p>
          ) : (
            <ul className="divide-y divide-zinc-800 text-sm">
              {t.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>
                    {new Date(p.periodStart).toLocaleDateString(lang === "tr" ? "tr-TR" : "sr-Latn")} –{" "}
                    {new Date(p.periodEnd).toLocaleDateString(lang === "tr" ? "tr-TR" : "sr-Latn")}
                  </span>
                  <span className="font-medium text-amber-400">€{p.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
