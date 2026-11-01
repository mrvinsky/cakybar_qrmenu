import { Shell } from "@/components/Shell";
import { requireTenant } from "@/lib/auth";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["ADMIN"]);
  const b = `/${slug}/admin`;
  const nav = [
    { href: b, label: "Dashboard" },
    { href: `${b}/pazar`, label: "Dnevni pazar" },
    { href: `${b}/inventar`, label: "Inventar" },
    { href: `${b}/popis`, label: "Popis" },
    { href: `${b}/nabavka`, label: "Nabavka" },
    { href: `${b}/dobavljaci`, label: "Dobavljači" },
    { href: `${b}/izvestaji`, label: "Izvještaji" },
    { href: `${b}/zaposleni`, label: "Zaposleni" },
    { href: `${b}/podesavanja`, label: "Podešavanja / Stolovi" },
    { href: `/${slug}/radnik/narudzbe`, label: "Narudžbe uživo" },
  ];
  return (
    <Shell title={tenant.name} nav={nav} session={session}>
      {children}
    </Shell>
  );
}
