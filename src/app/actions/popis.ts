"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** Admin otvara novi popis (ako već ne postoji otvoren). */
export async function openStockCountAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const note = String(fd.get("note") || "").trim() || null;

  const existingOpen = await db.stockCount.findFirst({
    where: { tenantId: tenant.id, status: "OPEN" },
  });
  if (existingOpen) return;

  const products = await db.product.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: { name: "asc" },
  });

  const created = await db.stockCount.create({
    data: {
      tenantId: tenant.id,
      status: "OPEN",
      note,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          expectedQuantity: p.currentQuantity,
          countedQuantity: 0,
        })),
      },
    },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "POPIS_OPEN",
    entity: "StockCount",
    entityId: created.id,
    details: { note, productCount: products.length },
  });

  revalidatePath(`/${slug}/admin/popis`);
  revalidatePath(`/${slug}/radnik/popis`);
}

/** Radnik ili Admin čuva prebrojane količine u otvorenom popisu. */
export async function saveCountedItemsAction(
  slug: string,
  stockCountId: string,
  entries: { productId: string; countedQuantity: number }[]
) {
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);

  const sc = await db.stockCount.findFirst({
    where: { id: stockCountId, tenantId: tenant.id, status: "OPEN" },
  });
  if (!sc) return { error: "Popis nije otvoren ili je već zaključan." };

  const products = await db.product.findMany({
    where: { tenantId: tenant.id, active: true },
    select: { id: true, currentQuantity: true },
  });
  const expMap = new Map(products.map((p) => [p.id, p.currentQuantity]));

  await db.$transaction(
    entries.map((e) =>
      db.stockCountItem.upsert({
        where: {
          stockCountId_productId: {
            stockCountId: sc.id,
            productId: e.productId,
          },
        },
        update: { countedQuantity: Math.max(0, Number(e.countedQuantity) || 0) },
        create: {
          stockCountId: sc.id,
          productId: e.productId,
          expectedQuantity: expMap.get(e.productId) ?? 0,
          countedQuantity: Math.max(0, Number(e.countedQuantity) || 0),
        },
      })
    )
  );

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "POPIS_COUNT_SAVE",
    entity: "StockCount",
    entityId: sc.id,
    details: { updatedItems: entries.length, by: session.name },
  });

  revalidatePath(`/${slug}/admin/popis`);
  revalidatePath(`/${slug}/radnik/popis`);
  return { ok: true };
}

/** Admin zaključava popis i izjednačava stvarne zalihe u magacinu sa prebrojanim stanjem. */
export async function lockStockCountAction(slug: string, stockCountId: string) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);

  const sc = await db.stockCount.findFirst({
    where: { id: stockCountId, tenantId: tenant.id, status: "OPEN" },
    include: { items: true },
  });
  if (!sc) return;

  await db.$transaction([
    ...sc.items.map((item) =>
      db.product.update({
        where: { id: item.productId },
        data: { currentQuantity: item.countedQuantity },
      })
    ),
    db.stockCount.update({
      where: { id: sc.id },
      data: { status: "LOCKED", lockedAt: new Date() },
    }),
    db.notification.create({
      data: {
        tenantId: tenant.id,
        type: "POPIS_LOCKED",
        title: "Popis je zaključan",
        message: `Zalihe za ${sc.items.length} artikala su ažurirane prema popisu.`,
      },
    }),
  ]);

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "POPIS_LOCK",
    entity: "StockCount",
    entityId: sc.id,
    details: { itemCount: sc.items.length },
  });

  revalidatePath(`/${slug}/admin/popis`);
  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/radnik/popis`);
  revalidatePath(`/${slug}/admin`);
}

/** Radnik prijavljuje nedostatak robe (bez dupliranja između I i II smjene). */
export async function createNeedReportAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);
  const productId = String(fd.get("productId") || "");
  const level = String(fd.get("level") || "PRI_KRAJU");
  const note = String(fd.get("note") || "").trim() || null;

  if (!productId || !["PRI_KRAJU", "NEDOSTAJE", "HITNO"].includes(level)) return;

  // Provjeri da li već postoji aktivna (neriješena) prijava za isti proizvod
  const existing = await db.needReport.findFirst({
    where: { tenantId: tenant.id, productId, resolved: false },
  });

  if (existing) {
    await db.needReport.update({
      where: { id: existing.id },
      data: {
        level,
        note: note ? `${existing.note ? existing.note + " · " : ""}${note}` : existing.note,
        userId: session.uid,
      },
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "NEED_REPORT_UPDATE",
      entity: "NeedReport",
      entityId: existing.id,
      details: { productId, level },
    });
  } else {
    const created = await db.needReport.create({
      data: {
        tenantId: tenant.id,
        productId,
        userId: session.uid,
        level,
        note,
      },
      include: { product: true },
    });
    await db.notification.create({
      data: {
        tenantId: tenant.id,
        type: "NEED_REPORT",
        title: `Prijava robe (${level}): ${created.product.name}`,
        message: note ?? `Prijavio: ${session.name}`,
      },
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "NEED_REPORT_CREATE",
      entity: "NeedReport",
      entityId: created.id,
      details: { product: created.product.name, level },
    });
  }

  revalidatePath(`/${slug}/radnik/prijava`);
  revalidatePath(`/${slug}/admin/nabavka`);
  revalidatePath(`/${slug}/admin`);
}

export async function resolveNeedReportAction(slug: string, reportId: string) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN", "RADNIK"]);
  await db.needReport.updateMany({
    where: { id: reportId, tenantId: tenant.id },
    data: { resolved: true },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "NEED_REPORT_RESOLVE",
    entity: "NeedReport",
    entityId: reportId,
  });
  revalidatePath(`/${slug}/radnik/prijava`);
  revalidatePath(`/${slug}/admin/nabavka`);
  revalidatePath(`/${slug}/admin`);
}
