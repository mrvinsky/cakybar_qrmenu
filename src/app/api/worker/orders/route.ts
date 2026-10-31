import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { emitTenantOrderEvent } from "@/lib/live-orders";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const s = await getSession();
  if (!s || !slug || s.slug !== slug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: {
      tenantId: s.tid!,
      status: { in: ["PENDING", "PREPARING", "SERVED"] },
    },
    include: {
      table: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || !s.tid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, status } = await req.json();
  const valid = ["PENDING", "PREPARING", "SERVED", "PAID", "CANCELLED"];
  if (!orderId || !valid.includes(status)) {
    return NextResponse.json({ error: "Neispravan status" }, { status: 400 });
  }

  const existing = await db.order.findFirst({
    where: { id: orderId, tenantId: s.tid },
    include: { items: true, table: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ako prelazi u PAID, umanji zalihe proizvoda
  if (status === "PAID" && existing.status !== "PAID") {
    for (const item of existing.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { currentQuantity: { decrement: item.quantity } },
      });
    }
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status },
    include: { table: true, items: { include: { product: true } } },
  });

  await audit({
    tenantId: s.tid,
    userId: s.uid,
    action: `ORDER_${status}`,
    entity: "Order",
    entityId: orderId,
    details: { table: existing.table.number, total: existing.totalAmount },
  });

  emitTenantOrderEvent(s.tid, {
    type: "STATUS_CHANGED",
    orderId: updated.id,
    tableNumber: existing.table.number,
  });

  return NextResponse.json({ order: updated });
}
