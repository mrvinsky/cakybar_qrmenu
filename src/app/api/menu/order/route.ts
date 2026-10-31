import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitTenantOrderEvent } from "@/lib/live-orders";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "");
    const tableNumber = Number(body.tableNumber);
    const notes = body.notes ? String(body.notes).slice(0, 300) : null;
    const source = body.source === "WAITER" ? "WAITER" : "QR";
    const items: { productId: string; quantity: number }[] = Array.isArray(body.items) ? body.items : [];

    if (!slug || !tableNumber || items.length === 0) {
      return NextResponse.json({ error: "Nedostaju podaci za narudžbu." }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Objekat nije aktivan." }, { status: 403 });
    }

    // Ako je objekat u režimu MENU_ONLY, gost ne može slati narudžbu preko QR menija (samo konobar može otvoriti sto)
    if (source === "QR" && tenant.qrMode === "MENU_ONLY") {
      return NextResponse.json(
        { error: "Naručivanje sa stola nije uključeno za ovaj objekat. Pozovite konobara." },
        { status: 403 }
      );
    }

    const table = await db.table.findUnique({
      where: { tenantId_number: { tenantId: tenant.id, number: tableNumber } },
    });
    if (!table || !table.active) {
      return NextResponse.json({ error: "Odabrani sto nije pronađen." }, { status: 404 });
    }

    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, tenantId: tenant.id, active: true },
    });
    const prodMap = new Map(products.map((p) => [p.id, p]));

    const orderItemsData: { productId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      const p = prodMap.get(item.productId);
      if (!p || !p.isAvailable) continue;
      const subtotal = Number((p.sellingPrice * qty).toFixed(2));
      totalAmount += subtotal;
      orderItemsData.push({
        productId: p.id,
        quantity: qty,
        unitPrice: p.sellingPrice,
        subtotal,
      });
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: "Nijedan odabrani artikal nije dostupan." }, { status: 400 });
    }

    const order = await db.order.create({
      data: {
        tenantId: tenant.id,
        tableId: table.id,
        status: source === "WAITER" ? "PREPARING" : "PENDING",
        totalAmount: Number(totalAmount.toFixed(2)),
        notes,
        items: { create: orderItemsData },
      },
      include: {
        table: true,
        items: { include: { product: true } },
      },
    });

    await db.notification.create({
      data: {
        tenantId: tenant.id,
        type: "NEW_ORDER",
        title: `Nova narudžba · Sto ${table.number}`,
        message: `Ukupno €${order.totalAmount.toFixed(2)} (${orderItemsData.length} stavki)`,
      },
    });

    await audit({
      tenantId: tenant.id,
      action: source === "WAITER" ? "ORDER_CREATE_WAITER" : "ORDER_CREATE_QR",
      entity: "Order",
      entityId: order.id,
      details: { table: table.number, total: order.totalAmount },
    });

    emitTenantOrderEvent(tenant.id, {
      type: "NEW_ORDER",
      orderId: order.id,
      tableNumber: table.number,
    });

    return NextResponse.json({ order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Greška pri kreiranju narudžbe." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  if (!orderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { table: true, items: { include: { product: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
