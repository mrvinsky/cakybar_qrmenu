import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminIzvestajiPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const { tenant } = await requireTenant(slug, ["ADMIN"]);

  const [revenues, purchases, paidOrders, lockedCounts] = await Promise.all([
    db.dailyRevenue.findMany({
      where: { tenantId: tenant.id },
      include: { user: true },
      orderBy: { date: "desc" },
    }),
    db.purchase.findMany({
      where: { tenantId: tenant.id, status: "RECEIVED" },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { tenantId: tenant.id, status: "PAID" },
      include: { items: { include: { product: true } } },
    }),
    db.stockCount.findMany({
      where: { tenantId: tenant.id, status: "LOCKED" },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // En çok satılan ürünler (OrderItem bazlı)
  const prodStatsMap = new Map<
    string,
    { name: string; qty: number; revenue: number; cost: number }
  >();
  for (const ord of paidOrders) {
    for (const it of ord.items) {
      const prev = prodStatsMap.get(it.productId) ?? {
        name: it.product.name,
        qty: 0,
        revenue: 0,
        cost: 0,
      };
      prev.qty += it.quantity;
      prev.revenue += it.subtotal;
      prev.cost += it.quantity * it.product.costPrice;
      prodStatsMap.set(it.productId, prev);
    }
  }
  const productSales = Array.from(prodStatsMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // Popis kayıp / fire (manjak) özeti
  let totalShortageEur = 0;
  for (const sc of lockedCounts) {
    for (const it of sc.items) {
      const diff = it.countedQuantity - it.expectedQuantity;
      if (diff < 0) {
        totalShortageEur += Math.abs(diff) * it.product.costPrice;
      }
    }
  }

  return (
    <ReportsClient
      tenantName={tenant.name}
      revenues={revenues.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        shift: r.shift,
        cash: r.cash,
        card: r.card,
        total: r.total,
        user: r.user?.name ?? "—",
      }))}
      purchases={purchases.map((p) => ({
        date: (p.receivedAt ?? p.createdAt).toISOString().slice(0, 10),
        supplier: p.supplier?.name ?? "Bez dobavljača",
        invoiceNo: p.invoiceNo ?? "—",
        total: p.totalAmount,
      }))}
      productSales={productSales}
      totalShortageEur={Number(totalShortageEur.toFixed(2))}
    />
  );
}
