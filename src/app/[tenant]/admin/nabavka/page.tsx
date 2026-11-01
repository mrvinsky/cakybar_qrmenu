import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { NabavkaClient } from "./NabavkaClient";

export const dynamic = "force-dynamic";

export default async function AdminNabavkaPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const [products, suppliers, openReports, purchases] = await Promise.all([
    db.product.findMany({
      where: { tenantId: tenant.id, active: true },
      include: { supplier: true, category: true },
      orderBy: { name: "asc" },
    }),
    db.supplier.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, contactPerson: true, email: true, address: true },
    }),
    db.needReport.findMany({
      where: { tenantId: tenant.id, resolved: false },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    db.purchase.findMany({
      where: { tenantId: tenant.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <NabavkaClient
      slug={slug}
      tenantInfo={{
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        contactPhone: tenant.contactPhone,
        contactEmail: tenant.contactEmail,
        address: tenant.address,
      }}
      products={products}
      suppliers={suppliers}
      openReports={openReports.map((r) => ({
        id: r.id,
        productId: r.productId,
        level: r.level,
        note: r.note,
        userName: r.user?.name ?? "Radnik",
      }))}
      purchases={purchases.map((p) => ({
        id: p.id,
        status: p.status,
        invoiceNo: p.invoiceNo,
        totalAmount: p.totalAmount,
        createdAt: p.createdAt.toISOString(),
        receivedAt: p.receivedAt ? p.receivedAt.toISOString() : null,
        supplierName: p.supplier?.name ?? "Bez dobavljača",
        supplierPhone: p.supplier?.phone ?? null,
        supplierContact: p.supplier?.contactPerson ?? null,
        supplierEmail: p.supplier?.email ?? null,
        supplierAddress: p.supplier?.address ?? null,
        items: p.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          productName: it.product.name,
          unit: it.product.unit,
        })),
      }))}
    />
  );
}
