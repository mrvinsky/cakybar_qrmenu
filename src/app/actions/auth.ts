"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, getSession, homeFor, setSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function loginAction(_: unknown, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const remember = fd.get("remember") === "on";

  const user = await db.user.findUnique({ where: { email }, include: { tenant: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Pogrešan email ili lozinka." };
  }
  if (!user.active) return { error: "Nalog je zamrznut. Kontaktirajte administratora." };
  if (user.role !== "SUPER_ADMIN" && user.tenant?.status !== "ACTIVE") {
    return { error: "Pristup ovom objektu je privremeno suspendovan." };
  }

  const s = {
    uid: user.id,
    role: user.role as "SUPER_ADMIN" | "ADMIN" | "RADNIK",
    tid: user.tenantId,
    slug: user.tenant?.slug ?? null,
    name: user.name,
  };
  await setSession(s, remember);
  await audit({ tenantId: user.tenantId, userId: user.id, action: "LOGIN" });
  redirect(homeFor(s));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

/** Završava impersonaciju i vraća platform vlasnika u njegov panel. */
export async function stopImpersonation() {
  const s = await getSession();
  if (!s?.imp) redirect("/login");
  const owner = await db.user.findUnique({ where: { id: s.imp } });
  if (!owner || owner.role !== "SUPER_ADMIN") {
    await clearSession();
    redirect("/login");
  }
  await setSession({ uid: owner.id, role: "SUPER_ADMIN", tid: null, slug: null, name: owner.name });
  redirect("/platform/tenants");
}

/** Oturum açmış kullanıcının (Super Admin, Admin veya Radnik) kendi şifresini değiştirmesi. */
export async function changeOwnPasswordAction(
  currentPassword: string,
  newPassword: string
) {
  const s = await getSession();
  if (!s) return { error: "Niste prijavljeni." };
  if (!newPassword || newPassword.length < 6) {
    return { error: "Nova lozinka mora imati najmanje 6 znakova." };
  }

  const user = await db.user.findUnique({ where: { id: s.uid } });
  if (!user) return { error: "Korisnik nije pronađen." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Trenutna lozinka nije tačna." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  await audit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "OWN_PASSWORD_CHANGE",
    entity: "User",
    entityId: user.id,
  });

  return { ok: true };
}
