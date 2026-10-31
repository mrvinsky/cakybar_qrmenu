import { db } from "./db";

export async function audit(p: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: unknown;
}) {
  await db.auditLog.create({
    data: {
      tenantId: p.tenantId ?? null,
      userId: p.userId ?? null,
      action: p.action,
      entity: p.entity,
      entityId: p.entityId,
      details: p.details === undefined ? null : JSON.stringify(p.details),
    },
  });
}
