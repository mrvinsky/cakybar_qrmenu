"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function submitRevenueAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);
  const shift = String(fd.get("shift") || "FIRST") === "SECOND" ? "SECOND" : "FIRST";
  const cash = Math.max(0, Number(fd.get("cash") || 0));
  const card = Math.max(0, Number(fd.get("card") || 0));
  const total = Number((cash + card).toFixed(2));
  const note = String(fd.get("note") || "").trim() || null;
  const dateStr = String(fd.get("date") || "");
  const date = dateStr ? new Date(dateStr) : new Date();

  if (total <= 0) return;

  const rev = await db.dailyRevenue.create({
    data: {
      tenantId: tenant.id,
      userId: session.uid,
      date,
      shift,
      cash,
      card,
      total,
      note,
    },
  });

  await db.notification.create({
    data: {
      tenantId: tenant.id,
      type: "NEW_REVENUE",
      title: `Predat pazar (${shift === "FIRST" ? "I smjena" : "II smjena"})`,
      message: `Ukupno €${total.toFixed(2)} (Gotovina €${cash.toFixed(2)} · Kartica €${card.toFixed(2)}) — ${session.name}`,
    },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "REVENUE_CREATE",
    entity: "DailyRevenue",
    entityId: rev.id,
    details: { shift, cash, card, total },
  });

  revalidatePath(`/${slug}/radnik/pazar`);
  revalidatePath(`/${slug}/admin/pazar`);
  revalidatePath(`/${slug}/admin/izvestaji`);
  revalidatePath(`/${slug}/admin`);
}

export async function deleteRevenueAction(slug: string, id: string) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  await db.dailyRevenue.deleteMany({
    where: { id, tenantId: tenant.id },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "REVENUE_DELETE",
    entity: "DailyRevenue",
    entityId: id,
  });
  revalidatePath(`/${slug}/admin/pazar`);
  revalidatePath(`/${slug}/admin/izvestaji`);
  revalidatePath(`/${slug}/admin`);
}

export async function createStaffUserAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const role = String(fd.get("role") || "RADNIK") === "ADMIN" ? "ADMIN" : "RADNIK";

  if (!name || !email || password.length < 6) {
    return { error: "Unesite ime, email i lozinku (min 6 znakova)." };
  }
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Ovaj email se već koristi." };
  }

  const user = await db.user.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "USER_CREATE",
    entity: "User",
    entityId: user.id,
    details: { name, email, role },
  });

  revalidatePath(`/${slug}/admin/zaposleni`);
  return { ok: true };
}

export async function updateStaffUserAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const id = String(fd.get("id") || "").trim();
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const role = String(fd.get("role") || "RADNIK") === "ADMIN" ? "ADMIN" : "RADNIK";
  const newPassword = String(fd.get("newPassword") || "").trim();

  if (!id || !name || !email) {
    return { error: "Ime i email su obavezni." };
  }

  const target = await db.user.findFirst({
    where: { id, tenantId: tenant.id },
  });
  if (!target) return { error: "Zaposleni nije pronađen." };

  const duplicate = await db.user.findUnique({ where: { email } });
  if (duplicate && duplicate.id !== id) {
    return { error: "Drugi korisnik već koristi ovaj email." };
  }

  const updateData: {
    name: string;
    email: string;
    role: string;
    passwordHash?: string;
  } = {
    name,
    email,
    // Admin ne može sam sebi oduzeti ADMIN ulogu
    role: id === session.uid ? "ADMIN" : role,
  };

  if (newPassword.length > 0) {
    if (newPassword.length < 6) {
      return { error: "Nova lozinka mora imati najmanje 6 znakova." };
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await db.user.update({
    where: { id },
    data: updateData,
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "USER_UPDATE",
    entity: "User",
    entityId: id,
    details: { name, email, role: updateData.role, passwordChanged: newPassword.length > 0 },
  });

  revalidatePath(`/${slug}/admin/zaposleni`);
  return { ok: true };
}

export async function deleteStaffUserAction(slug: string, userId: string) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  if (userId === session.uid) return; // Admin ne može obrisati samog sebe

  const target = await db.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
  });
  if (!target) return;

  // Odveži istoriju (pazar, prijave, audit) da se ne izgubi pri brisanju radnika
  await db.$transaction([
    db.dailyRevenue.updateMany({ where: { userId }, data: { userId: null } }),
    db.needReport.updateMany({ where: { userId }, data: { userId: null } }),
    db.auditLog.updateMany({ where: { userId }, data: { userId: null } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "USER_DELETE",
    entity: "User",
    entityId: userId,
    details: { deletedName: target.name, deletedEmail: target.email },
  });

  revalidatePath(`/${slug}/admin/zaposleni`);
}

export async function toggleStaffActiveAction(
  slug: string,
  userId: string,
  active: boolean
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  if (userId === session.uid) return; // Admin ne može zamrznuti sam sebe

  await db.user.updateMany({
    where: { id: userId, tenantId: tenant.id },
    data: { active },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: active ? "USER_ACTIVATE" : "USER_FREEZE",
    entity: "User",
    entityId: userId,
  });

  revalidatePath(`/${slug}/admin/zaposleni`);
}

export async function resetStaffPasswordAction(
  slug: string,
  userId: string,
  fd: FormData
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const newPassword = String(fd.get("newPassword") || "");
  if (newPassword.length < 6) return;

  await db.user.updateMany({
    where: { id: userId, tenantId: tenant.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "USER_PASSWORD_RESET",
    entity: "User",
    entityId: userId,
  });

  revalidatePath(`/${slug}/admin/zaposleni`);
}
