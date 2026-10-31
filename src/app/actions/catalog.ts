"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function saveSupplierAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const id = String(fd.get("id") || "").trim();
  const name = String(fd.get("name") || "").trim();
  if (!name) return;

  const data = {
    name,
    contactPerson: String(fd.get("contactPerson") || "").trim() || null,
    phone: String(fd.get("phone") || "").trim() || null,
    email: String(fd.get("email") || "").trim() || null,
    address: String(fd.get("address") || "").trim() || null,
    notes: String(fd.get("notes") || "").trim() || null,
  };

  if (id) {
    await db.supplier.updateMany({
      where: { id, tenantId: tenant.id },
      data,
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "SUPPLIER_UPDATE",
      entity: "Supplier",
      entityId: id,
      details: { name },
    });
  } else {
    const created = await db.supplier.create({
      data: { ...data, tenantId: tenant.id },
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "SUPPLIER_CREATE",
      entity: "Supplier",
      entityId: created.id,
      details: { name },
    });
  }

  revalidatePath(`/${slug}/admin/dobavljaci`);
  revalidatePath(`/${slug}/admin/inventar`);
}

export async function toggleSupplierAction(slug: string, id: string, active: boolean) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  await db.supplier.updateMany({
    where: { id, tenantId: tenant.id },
    data: { active },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: active ? "SUPPLIER_ACTIVATE" : "SUPPLIER_DEACTIVATE",
    entity: "Supplier",
    entityId: id,
  });
  revalidatePath(`/${slug}/admin/dobavljaci`);
}

export async function saveCategoryAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const name = String(fd.get("name") || "").trim();
  const sortOrder = Number(fd.get("sortOrder") || 0);
  if (!name) return;

  const cat = await db.category.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name } },
    update: { sortOrder, active: true },
    create: { tenantId: tenant.id, name, sortOrder },
  });

  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: "CATEGORY_UPSERT",
    entity: "Category",
    entityId: cat.id,
    details: { name },
  });

  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/menu`);
}

export async function saveProductAction(slug: string, fd: FormData) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const id = String(fd.get("id") || "").trim();
  const name = String(fd.get("name") || "").trim();
  if (!name) return;

  const data = {
    name,
    categoryId: String(fd.get("categoryId") || "") || null,
    supplierId: String(fd.get("supplierId") || "") || null,
    unit: String(fd.get("unit") || "kom").trim() || "kom",
    currentQuantity: Number(fd.get("currentQuantity") || 0),
    minQuantity: Number(fd.get("minQuantity") || 0),
    optimalQuantity: Number(fd.get("optimalQuantity") || 0),
    costPrice: Number(fd.get("costPrice") || 0),
    sellingPrice: Number(fd.get("sellingPrice") || 0),
    imageUrl: String(fd.get("imageUrl") || "").trim() || null,
    description: String(fd.get("description") || "").trim() || null,
    isAvailable: fd.get("isAvailable") !== "false",
  };

  if (id) {
    await db.product.updateMany({
      where: { id, tenantId: tenant.id },
      data,
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: id,
      details: { name, sellingPrice: data.sellingPrice, qty: data.currentQuantity },
    });
  } else {
    const created = await db.product.create({
      data: { ...data, tenantId: tenant.id },
    });
    await audit({
      tenantId: tenant.id,
      userId: session.uid,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: created.id,
      details: { name, sellingPrice: data.sellingPrice, qty: data.currentQuantity },
    });
  }

  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/menu`);
}

export async function toggleProductAvailabilityAction(
  slug: string,
  productId: string,
  isAvailable: boolean
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  await db.product.updateMany({
    where: { id: productId, tenantId: tenant.id },
    data: { isAvailable },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: isAvailable ? "PRODUCT_AVAILABLE" : "PRODUCT_SOLD_OUT",
    entity: "Product",
    entityId: productId,
  });
  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/menu`);
}

export async function toggleProductActiveAction(
  slug: string,
  productId: string,
  active: boolean
) {
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  await db.product.updateMany({
    where: { id: productId, tenantId: tenant.id },
    data: { active },
  });
  await audit({
    tenantId: tenant.id,
    userId: session.uid,
    action: active ? "PRODUCT_RESTORE" : "PRODUCT_ARCHIVE",
    entity: "Product",
    entityId: productId,
  });
  revalidatePath(`/${slug}/admin/inventar`);
  revalidatePath(`/${slug}/menu`);
}
