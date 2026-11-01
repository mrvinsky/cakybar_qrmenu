import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TenantDetailClient } from "./TenantDetailClient";

export default async function TenantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await db.tenant.findUnique({
    where: { id },
    include: {
      plan: true,
      payments: { orderBy: { createdAt: "desc" } },
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { tables: true, products: true, orders: true } },
    },
  });
  if (!t) notFound();
  const plans = await db.plan.findMany({ orderBy: { priceMonthly: "asc" } });

  return (
    <TenantDetailClient
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.priceMonthly,
      }))}
      tenant={{
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        qrMode: t.qrMode,
        planId: t.planId,
        paymentStatus: t.paymentStatus,
        subscriptionEndsAt: t.subscriptionEndsAt ? t.subscriptionEndsAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        plan: t.plan ? { id: t.plan.id, name: t.plan.name } : null,
        payments: t.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          periodStart: p.periodStart.toISOString(),
          periodEnd: p.periodEnd.toISOString(),
        })),
        users: t.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
        })),
        _count: t._count,
      }}
    />
  );
}
