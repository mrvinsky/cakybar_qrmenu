// Edge-kompatibilan (koristi ga i middleware) – bez Prisma importa.
import { SignJWT, jwtVerify } from "jose";

export type Role = "SUPER_ADMIN" | "ADMIN" | "RADNIK";

export type Session = {
  uid: string;
  role: Role;
  tid: string | null; // tenantId
  slug: string | null; // tenant slug
  name: string;
  imp?: string; // ako je impersonacija: uid platform vlasnika
};

export const COOKIE = "session";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

export async function signSession(s: Session, remember = false) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "30d" : "12h")
    .sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
