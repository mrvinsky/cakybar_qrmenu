import { db } from "@/lib/db";
import { PlatformAuditClient } from "./PlatformAuditClient";

export default async function PlatformAudit() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, tenant: true },
  });

  return (
    <PlatformAuditClient
      logs={logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt.toISOString(),
        tenantName: l.tenant?.name ?? null,
        userName: l.user?.name ?? null,
        action: l.action,
        details: l.details,
      }))}
    />
  );
}
