import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { AdminPopisClient } from "./AdminPopisClient";

export const dynamic = "force-dynamic";

export default async function AdminPopisPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const allCounts = await db.stockCount.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      lockedAt: true,
    },
  });

  const selectedId = sp.id ?? allCounts[0]?.id ?? null;

  const currentCount = selectedId
    ? await db.stockCount.findFirst({
        where: { id: selectedId, tenantId: tenant.id },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
            orderBy: { product: { name: "asc" } },
          },
        },
      })
    : null;

  const hasOpen = allCounts.some((c) => c.status === "OPEN");

  return (
    <AdminPopisClient
      slug={slug}
      allCounts={allCounts.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        lockedAt: c.lockedAt ? c.lockedAt.toISOString() : null,
      }))}
      currentCount={
        currentCount
          ? {
              id: currentCount.id,
              status: currentCount.status as "OPEN" | "LOCKED",
              note: currentCount.note,
              createdAt: currentCount.createdAt.toISOString(),
              lockedAt: currentCount.lockedAt ? currentCount.lockedAt.toISOString() : null,
              items: currentCount.items,
            }
          : null
      }
      hasOpen={hasOpen}
    />
  );
}
