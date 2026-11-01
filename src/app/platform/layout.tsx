import { Shell } from "@/components/Shell";
import { requirePlatform } from "@/lib/auth";
import { LanguageProvider } from "@/contexts/LanguageContext";

const nav = [
  { href: "/platform", label: "Pregled" },
  { href: "/platform/tenants", label: "Objekti (kafići)" },
  { href: "/platform/plans", label: "Planovi" },
  { href: "/platform/audit", label: "Audit log" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const s = await requirePlatform();
  return (
    <LanguageProvider>
      <Shell title="BarOS Platforma" nav={nav} session={s}>
        {children}
      </Shell>
    </LanguageProvider>
  );
}
