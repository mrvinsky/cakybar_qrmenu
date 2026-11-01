"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTenant } from "@/app/actions/platform";
import { useLanguage } from "@/contexts/LanguageContext";

export function CreateTenantForm({ plans }: { plans: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTenant, null);
  const ref = useRef<HTMLFormElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (state && "ok" in state) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        {t.newTenant}
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className="card grid gap-3 md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">{t.formNewTenant}</h2>
      <div>
        <label className="label">{t.formName}</label>
        <input name="name" required className="input" placeholder={t.formNamePlaceholder} />
      </div>
      <div>
        <label className="label">{t.formSlug}</label>
        <input name="slug" required className="input" placeholder={t.formSlugPlaceholder} />
      </div>
      <div>
        <label className="label">{t.formQrType}</label>
        <select name="qrMode" className="input" defaultValue="TABLE_ORDERING">
          <option value="TABLE_ORDERING">{t.formQrOptionTable}</option>
          <option value="MENU_ONLY">{t.formQrOptionMenu}</option>
        </select>
      </div>
      <div>
        <label className="label">{t.formPlan}</label>
        <select name="planId" className="input">
          <option value="">{t.formNoPlan}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t.formContactEmail}</label>
        <input name="contactEmail" type="email" className="input" />
      </div>
      <h3 className="pt-2 text-sm font-semibold text-zinc-300 md:col-span-2">
        {t.formAdminSection}
      </h3>
      <div>
        <label className="label">{t.formAdminName}</label>
        <input name="adminName" required className="input" />
      </div>
      <div>
        <label className="label">{t.formAdminEmail}</label>
        <input name="adminEmail" type="email" required className="input" />
      </div>
      <div>
        <label className="label">{t.formAdminPassword}</label>
        <input name="adminPassword" type="password" required minLength={6} className="input" />
      </div>
      <div className="flex items-end gap-2">
        <button className="btn" disabled={pending}>
          {pending ? t.formCreating : t.formCreateBtn}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
          {t.formCancel}
        </button>
      </div>
      {state && "error" in state && (
        <p className="text-sm text-red-400 md:col-span-2">{state.error}</p>
      )}
      <p className="text-xs text-zinc-500 md:col-span-2">{t.formTrialNotice}</p>
    </form>
  );
}
