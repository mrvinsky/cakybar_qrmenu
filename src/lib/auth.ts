import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { COOKIE, signSession, verifySession, type Role, type Session } from "./jwt";

export async function getSession() {
  const c = await cookies();
  return verifySession(c.get(COOKIE)?.value);
}

export async function setSession(s: Session, remember = false) {
  const c = await cookies();
  c.set(COOKIE, await signSession(s, remember), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 30 * 86400 : undefined,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export function homeFor(s: Session) {
  if (s.role === "SUPER_ADMIN") return "/platform";
  return `/${s.slug}/${s.role === "ADMIN" ? "admin" : "radnik"}`;
}

/** Server-side zaštita platform panela. */
export async function requirePlatform() {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") redirect("/login");
  return s;
}

/**
 * Server-side zaštita tenant stranica: provjerava sesiju, pripadnost tenantu,
 * ulogu i da tenant nije suspendovan. Vraća sesiju + tenant.
 */
export async function requireTenant(slug: string, roles: Role[]) {
  const s = await getSession();
  if (!s || s.slug !== slug || !roles.includes(s.role)) redirect("/login");
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant || s.tid !== tenant.id) redirect("/login");
  if (tenant.status !== "ACTIVE" && !s.imp) redirect("/suspendovan");
  const user = await db.user.findUnique({ where: { id: s.uid } });
  if (!user || !user.active) {
    await clearSession();
    redirect("/login");
  }
  return { session: s, tenant };
}
