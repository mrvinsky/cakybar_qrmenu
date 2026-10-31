"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePlatform, setSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/, "Slug: mala slova, brojevi i crtica"),
  qrMode: z.enum(["MENU_ONLY", "TABLE_ORDERING"]).default("TABLE_ORDERING"),
  planId: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

const RESERVED = ["platform", "login", "api", "suspendovan", "_next", "admin"];

export async function createTenant(_: unknown, fd: FormData) {
  const s = await requirePlatform();
  const parsed = tenantSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (RESERVED.includes(d.slug)) return { error: "Ovaj slug je rezervisan." };
  if (await db.tenant.findUnique({ where: { slug: d.slug } })) return { error: "Slug je zauzet." };
  if (await db.user.findUnique({ where: { email: d.adminEmail.toLowerCase() } })) return { error: "Email admina već postoji." };

  const tenant = await db.tenant.create({
    data: {
      name: d.name,
      slug: d.slug,
      qrMode: d.qrMode,
      planId: d.planId || null,
      contactEmail: d.contactEmail || null,
      paymentStatus: "TRIAL",
      subscriptionEndsAt: new Date(Date.now() + 14 * 864e5),
      users: {
        create: {
          name: d.adminName,
          email: d.adminEmail.toLowerCase(),
          passwordHash: await bcrypt.hash(d.adminPassword, 10),
          role: "ADMIN",
        },
      },
    },
  });
  await audit({ userId: s.uid, action: "TENANT_CREATE", entity: "Tenant", entityId: tenant.id, details: { slug: d.slug } });
  revalidatePath("/platform/tenants");
  return { ok: true };
}

export async function setTenantStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  const s = await requirePlatform();
  await db.tenant.update({ where: { id }, data: { status } });
  await audit({ userId: s.uid, action: status === "ACTIVE" ? "TENANT_ACTIVATE" : "TENANT_SUSPEND", entity: "Tenant", entityId: id });
  revalidatePath("/platform/tenants");
  revalidatePath(`/platform/tenants/${id}`);
}

export async function updateTenantPlan(id: string, fd: FormData) {
  const s = await requirePlatform();
  const planId = String(fd.get("planId") || "") || null;
  const qrMode = String(fd.get("qrMode") || "TABLE_ORDERING") === "MENU_ONLY" ? "MENU_ONLY" : "TABLE_ORDERING";
  const paymentStatus = String(fd.get("paymentStatus") || "TRIAL");
  const ends = String(fd.get("subscriptionEndsAt") || "");
  await db.tenant.update({
    where: { id },
    data: { planId, qrMode, paymentStatus, subscriptionEndsAt: ends ? new Date(ends) : null },
  });
  await audit({ userId: s.uid, action: "TENANT_PLAN_UPDATE", entity: "Tenant", entityId: id, details: { planId, qrMode, paymentStatus, ends } });
  revalidatePath(`/platform/tenants/${id}`);
  revalidatePath("/platform/tenants");
}

/** Evidentira uplatu i automatski produžava pretplatu do kraja perioda. */
export async function addPayment(tenantId: string, fd: FormData) {
  const s = await requirePlatform();
  const amount = Number(fd.get("amount"));
  const periodStart = new Date(String(fd.get("periodStart")));
  const periodEnd = new Date(String(fd.get("periodEnd")));
  if (!amount || isNaN(+periodStart) || isNaN(+periodEnd)) return;
  await db.$transaction([
    db.payment.create({
      data: { tenantId, amount, periodStart, periodEnd, method: String(fd.get("method") || "BANK"), note: String(fd.get("note") || "") || null },
    }),
    db.tenant.update({ where: { id: tenantId }, data: { paymentStatus: "PAID", subscriptionEndsAt: periodEnd } }),
  ]);
  await audit({ userId: s.uid, action: "PAYMENT_ADD", entity: "Tenant", entityId: tenantId, details: { amount } });
  revalidatePath(`/platform/tenants/${tenantId}`);
}

export async function savePlan(fd: FormData) {
  const s = await requirePlatform();
  const id = String(fd.get("id") || "");
  const data = {
    name: String(fd.get("name")),
    priceMonthly: Number(fd.get("priceMonthly") || 0),
    maxUsers: Number(fd.get("maxUsers") || 5),
    maxTables: Number(fd.get("maxTables") || 20),
    features: String(fd.get("features") || "") || null,
  };
  if (!data.name) return;
  if (id) await db.plan.update({ where: { id }, data });
  else await db.plan.create({ data });
  await audit({ userId: s.uid, action: id ? "PLAN_UPDATE" : "PLAN_CREATE", entity: "Plan", details: data });
  revalidatePath("/platform/plans");
}

/** Podrška: platform vlasnik se prijavljuje kao admin objekta (sa trakom za povratak). */
export async function impersonate(tenantId: string) {
  const s = await requirePlatform();
  const admin = await db.user.findFirst({
    where: { tenantId, role: "ADMIN", active: true },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin?.tenant) return;
  await audit({ tenantId, userId: s.uid, action: "IMPERSONATE", entity: "User", entityId: admin.id });
  await setSession({ uid: admin.id, role: "ADMIN", tid: tenantId, slug: admin.tenant.slug, name: admin.name, imp: s.uid });
  redirect(`/${admin.tenant.slug}/admin`);
}

/** Platform vlasnik dodaje novog korisnika (Admin ili Radnik) u objekat. */
export async function platformCreateTenantUser(tenantId: string, fd: FormData) {
  const s = await requirePlatform();
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const role = String(fd.get("role") || "RADNIK") === "ADMIN" ? "ADMIN" : "RADNIK";
  if (!name || !email || password.length < 6) return;
  if (await db.user.findUnique({ where: { email } })) return;

  const u = await db.user.create({
    data: {
      tenantId,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
  });
  await audit({ tenantId, userId: s.uid, action: "PLATFORM_USER_CREATE", entity: "User", entityId: u.id, details: { name, email, role } });
  revalidatePath(`/platform/tenants/${tenantId}`);
}

/** Platform vlasnik mijenja lozinku, ulogu ili status korisnika objekta. */
export async function platformUpdateTenantUser(tenantId: string, userId: string, fd: FormData) {
  const s = await requirePlatform();
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const role = String(fd.get("role") || "RADNIK") === "ADMIN" ? "ADMIN" : "RADNIK";
  const newPassword = String(fd.get("newPassword") || "").trim();
  const active = fd.get("active") !== "false";

  if (!name || !email) return;
  const dup = await db.user.findUnique({ where: { email } });
  if (dup && dup.id !== userId) return;

  await db.user.updateMany({
    where: { id: userId, tenantId },
    data: {
      name,
      email,
      role,
      active,
      ...(newPassword.length >= 6 ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });
  await audit({ tenantId, userId: s.uid, action: "PLATFORM_USER_UPDATE", entity: "User", entityId: userId, details: { name, email, role, active } });
  revalidatePath(`/platform/tenants/${tenantId}`);
}

/** Platform vlasnik briše korisnika objekta. */
export async function platformDeleteTenantUser(tenantId: string, userId: string) {
  const s = await requirePlatform();
  await db.$transaction([
    db.dailyRevenue.updateMany({ where: { userId }, data: { userId: null } }),
    db.needReport.updateMany({ where: { userId }, data: { userId: null } }),
    db.auditLog.updateMany({ where: { userId }, data: { userId: null } }),
    db.user.deleteMany({ where: { id: userId, tenantId } }),
  ]);
  await audit({ tenantId, userId: s.uid, action: "PLATFORM_USER_DELETE", entity: "User", entityId: userId });
  revalidatePath(`/platform/tenants/${tenantId}`);
}
