"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type AuditItem = {
  id: string;
  createdAt: string;
  tenantName: string | null;
  userName: string | null;
  action: string;
  details: string | null;
};

export function PlatformAuditClient({ logs }: { logs: AuditItem[] }) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.auditTitle}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-400">
            <tr className="border-b border-zinc-800">
              <th className="p-3">{t.auditTime}</th>
              <th>{t.auditTenant}</th>
              <th>{t.auditUser}</th>
              <th>{t.auditAction}</th>
              <th>{t.auditDetails}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/60">
                <td className="p-3 whitespace-nowrap text-zinc-400">
                  {new Date(l.createdAt).toLocaleString(
                    lang === "tr" ? "tr-TR" : "sr-Latn"
                  )}
                </td>
                <td>{l.tenantName ?? "Platform"}</td>
                <td>{l.userName ?? "—"}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td className="max-w-xs truncate text-xs text-zinc-500">
                  {l.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
