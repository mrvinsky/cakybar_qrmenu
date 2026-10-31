"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type PurchaseDraftItem = {
  productId: string;
  supplierId: string | null;
  quantity: number;
  unitPrice: number;
};

/**
 * Kreira jednu ili više narudžbenica (grupisano po dobavljaču)
 * iz predložene liste za nabavku.
 */
export async function createPurchasesFromSuggestionsAction(
  slug: string,
  items: PurchaseDraftItem[]
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const valid = items.filter((i) => i.productId && i.quantity > 0);
  if (valid.length === 0) return { error: "Nema odabranih stavki za nabavku." };

  // Grupiši po supplierId (null -> "NO_SUPPLIER")
  const groups = new Map<string | null, PurchaseDraftItem[]>();
  for (const it of valid) {
    const key = it.supplierId || null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  for (const [supplierId, groupItems] of groups.entries()) {
    const totalAmount = groupItems.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.unitPrice || 0),
      0
    );

    const purchase = await db.purchase.create({
      data: {
        tenantId: tenant.id,
        supplierId,
        status: "ORDERED",
        totalAmount: Number(totalAmount.toFixed(2)),
        items: {
          create: groupItems.map((g) => ({
            productId: g.productId,
            quantity: Number(g.quantity),
            unitPrice: Number(g.unitPrice || 0),
          })),
        },
      },
    });

    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "PURCHASE_CREATE",
      entity: "Purchase",
      entityId: purchase.id,
      details: { supplierId, itemsCount: groupItems.length, total: purchase.totalAmount },
    });
  }

  revalidatePath(`/${slug}/admin/nabavka`);
  return { ok: true };
}

/**
 * Potvrđuje prijem robe po narudžbenici:
 * 1. Povećava currentQuantity za svaki artikal i ažurira costPrice (ako je unijet)
 * 2. Zatvara aktivne prijave radnika (NeedReport) za primljene artikle
 * 3. Označava Purchase kao RECEIVED sa brojem fakture
 */
export async function receivePurchaseAction(
  slug: string,
  purchaseId: string,
  fd: FormData
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const invoiceNo = String(fd.get("invoiceNo") || "").trim() || null;

  const purchase = await db.purchase.findFirst({
    where: { id: purchaseId, tenantId: tenant.id },
    include: { items: true },
  });
  if (!purchase || purchase.status === "RECEIVED") return;

  const productIds = purchase.items.map((i) => i.productId);

  await db.$transaction([
    ...purchase.items.map((it) =>
      db.product.update({
        where: { id: it.productId },
        data: {
          currentQuantity: { increment: it.quantity },
          ...(it.unitPrice > 0 ? { costPrice: it.unitPrice } : {}),
        },
      })
    ),
    db.needReport.updateMany({
      where: {
        tenantId: tenant.id,
        productId: { in: productIds },
        resolved: false,
      },
      data: { resolved: true },
    }),
    db.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "RECEIVED",
        invoiceNo,
        receivedAt: new Date(),
      },
    }),
  ]);

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "PURCHASE_RECEIVE",
    entity: "Purchase",
    entityId: purchase.id,
    details: { invoiceNo, totalAmount: purchase.totalAmount, items: purchase.items.length },
  });

  revalidatePath(`/${slug}/admin/nabavka`);
  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/radnik/prijava`);
  revalidatePath(`/${slug}/admin`);
}

export async function deletePurchaseAction(slug: string, purchaseId: string) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const purchase = await db.purchase.findFirst({
    where: { id: purchaseId, tenantId: tenant.id },
  });
  if (!purchase || purchase.status === "RECEIVED") return;

  await db.purchase.delete({ where: { id: purchase.id } });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "PURCHASE_DELETE",
    entity: "Purchase",
    entityId: purchaseId,
  });

  revalidatePath(`/${slug}/admin/nabavka`);
}
