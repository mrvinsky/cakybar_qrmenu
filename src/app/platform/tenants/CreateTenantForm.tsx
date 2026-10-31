"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTenant } from "@/app/actions/platform";

export function CreateTenantForm({ plans }: { plans: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTenant, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ Novi objekat</button>;

  return (
    <form ref={ref} action={action} className="card grid gap-3 md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">Novi objekat</h2>
      <div><label className="label">Naziv</label><input name="name" required className="input" placeholder="Caffe Bar Primjer" /></div>
      <div><label className="label">Slug (URL)</label><input name="slug" required className="input" placeholder="caffe-primjer" /></div>
      <div>
        <label className="label">Tip QR menija</label>
        <select name="qrMode" className="input" defaultValue="TABLE_ORDERING">
          <option value="TABLE_ORDERING">QR Meni + Naručivanje sa stola (poseban QR po stolu)</option>
          <option value="MENU_ONLY">Samo digitalni QR Meni (jedan QR bez naručivanja)</option>
        </select>
      </div>
      <div>
        <label className="label">Plan</label>
        <select name="planId" className="input">
          <option value="">— bez plana —</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div><label className="label">Kontakt email</label><input name="contactEmail" type="email" className="input" /></div>
      <h3 className="pt-2 text-sm font-semibold text-zinc-300 md:col-span-2">Admin nalog objekta</h3>
      <div><label className="label">Ime</label><input name="adminName" required className="input" /></div>
      <div><label className="label">Email</label><input name="adminEmail" type="email" required className="input" /></div>
      <div><label className="label">Lozinka</label><input name="adminPassword" type="password" required minLength={6} className="input" /></div>
      <div className="flex items-end gap-2">
        <button className="btn" disabled={pending}>{pending ? "Kreiram..." : "Kreiraj"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Otkaži</button>
      </div>
      {state && "error" in state && <p className="text-sm text-red-400 md:col-span-2">{state.error}</p>}
      <p className="text-xs text-zinc-500 md:col-span-2">Novi objekat dobija 14 dana probnog perioda.</p>
    </form>
  );
}
