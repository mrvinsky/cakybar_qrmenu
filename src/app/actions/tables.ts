"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function addTableAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const number = Number(fd.get("number"));
  const name = String(fd.get("name") || "").trim() || `Sto ${number}`;
  if (!number || number < 1) return;

  await db.table.upsert({
    where: { tenantId_number: { tenantId: tenant.id, number } },
    update: { name, active: true },
    create: { tenantId: tenant.id, number, name },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "TABLE_UPSERT",
    entity: "Table",
    details: { number, name },
  });
  revalidatePath(`/${slug}/admin/podesavanja`);
}

export async function toggleTableAction(slug: string, tableId: string, active: boolean) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  await db.table.updateMany({
    where: { id: tableId, tenantId: tenant.id },
    data: { active },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: active ? "TABLE_ACTIVATE" : "TABLE_DEACTIVATE",
    entity: "Table",
    entityId: tableId,
  });
  revalidatePath(`/${slug}/admin/podesavanja`);
}

export async function updateTenantBrandingAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const logoUrl = String(fd.get("logoUrl") || "").trim() || null;
  const contactPhone = String(fd.get("contactPhone") || "").trim() || null;
  const contactEmail = String(fd.get("contactEmail") || "").trim() || null;
  const address = String(fd.get("address") || "").trim() || null;

  await db.tenant.update({
    where: { id: tenant.id },
    data: { logoUrl, contactPhone, contactEmail, address },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "TENANT_BRANDING_UPDATE",
    entity: "Tenant",
    entityId: tenant.id,
  });

  revalidatePath(`/${slug}/admin/podesavanja`);
  revalidatePath(`/${slug}/admin/nabavka`);
}
