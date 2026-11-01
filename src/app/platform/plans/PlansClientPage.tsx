"use client";

import { savePlan } from "@/app/actions/platform";
import { useLanguage } from "@/contexts/LanguageContext";

type PlanItem = {
  id: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxTables: number;
  features: string | null;
  tenantCount: number;
};

function PlanForm({ p }: { p?: PlanItem }) {
  const { t } = useLanguage();

  return (
    <form action={savePlan} className="card grid gap-3 md:grid-cols-6 md:items-end">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="md:col-span-2">
        <label className="label">{t.planName}</label>
        <input name="name" required defaultValue={p?.name} className="input" />
      </div>
      <div>
        <label className="label">{t.planPriceEur}</label>
        <input
          name="priceMonthly"
          type="number"
          step="0.01"
          defaultValue={p?.priceMonthly ?? 0}
          className="input"
        />
      </div>
      <div>
        <label className="label">{t.planMaxUsers}</label>
        <input
          name="maxUsers"
          type="number"
          defaultValue={p?.maxUsers ?? 5}
          className="input"
        />
      </div>
      <div>
        <label className="label">{t.planMaxTables}</label>
        <input
          name="maxTables"
          type="number"
          defaultValue={p?.maxTables ?? 20}
          className="input"
        />
      </div>
      <button className="btn">{p ? t.planSave : t.planAdd}</button>
      <div className="md:col-span-6">
        <input
          name="features"
          placeholder={t.planFeatures}
          defaultValue={p?.features ?? ""}
          className="input"
        />
      </div>
    </form>
  );
}

export function PlansClientPage({ plans }: { plans: PlanItem[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.plansTitle}</h1>
      {plans.map((p) => (
        <div key={p.id}>
          <p className="mb-1 text-xs text-zinc-500">
            {p.tenantCount} {t.tenantsUsingPlan}
          </p>
          <PlanForm p={p} />
        </div>
      ))}
      <h2 className="pt-4 font-semibold">{t.newPlanTitle}</h2>
      <PlanForm />
    </div>
  );
}
