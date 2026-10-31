import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QrMenuClient } from "./QrMenuClient";

export const dynamic = "force-dynamic";

export default async function TenantQrMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ table?: string; sto?: string }>;
}) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const initialTableNum = Number(sp.table ?? sp.sto ?? 0) || null;

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status !== "ACTIVE") notFound();

  const [categories, products, tables] = await Promise.all([
    db.category.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: { tenantId: tenant.id, active: true, sellingPrice: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
    db.table.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { number: "asc" },
    }),
  ]);

  return (
    <QrMenuClient
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        qrMode: tenant.qrMode as "MENU_ONLY" | "TABLE_ORDERING",
      }}
      categories={categories}
      products={products}
      tables={tables}
      initialTableNumber={initialTableNum}
    />
  );
}
