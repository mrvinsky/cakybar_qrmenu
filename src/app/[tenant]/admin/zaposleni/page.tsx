import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { ZaposleniClient } from "./ZaposleniClient";

export const dynamic = "force-dynamic";

export default async function AdminZaposleniPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);

  const users = await db.user.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ZaposleniClient
      slug={slug}
      currentUserId={session.uid}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as "ADMIN" | "RADNIK",
        active: u.active,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
