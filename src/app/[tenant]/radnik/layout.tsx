import { Shell } from "@/components/Shell";
import { requireTenant } from "@/lib/auth";

export default async function RadnikLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const { session, tenant } = await requireTenant(slug, ["RADNIK", "ADMIN"]);
  const b = `/${slug}/radnik`;
  const nav = [
    { href: b, label: "Moj rad" },
    { href: `${b}/narudzbe`, label: "Narudžbe uživo" },
    { href: `${b}/pazar`, label: "Zatvori smjenu" },
    { href: `${b}/popis`, label: "Popis" },
    { href: `${b}/prijava`, label: "Prijavi potrebu" },
    ...(session.role === "ADMIN" ? [{ href: `/${slug}/admin`, label: "← Admin panel" }] : []),
  ];
  return (
    <Shell title={tenant.name} nav={nav} session={session}>
      {children}
    </Shell>
  );
}
