import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/jwt";

// Brza (edge) provjera. Detaljna provjera (status tenanta, aktivnost korisnika) je u requireTenant/requirePlatform.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  const login = () => NextResponse.redirect(new URL("/login", req.url));

  if (pathname.startsWith("/platform")) {
    if (s?.role !== "SUPER_ADMIN") return login();
    return NextResponse.next();
  }

  // /[slug]/admin/... ili /[slug]/radnik/...
  const m = pathname.match(/^\/([^/]+)\/(admin|radnik)(\/|$)/);
  if (m) {
    const [, slug, area] = m;
    if (!s || s.slug !== slug) return login();
    if (area === "admin" && s.role !== "ADMIN") return login();
    if (area === "radnik" && s.role !== "RADNIK" && s.role !== "ADMIN") return login();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*", "/:slug/admin/:path*", "/:slug/radnik/:path*"],
};
