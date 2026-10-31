import { requireTenant } from "@/lib/auth";

export default async function MojRad({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const { session } = await requireTenant(slug, ["RADNIK", "ADMIN"]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Zdravo, {session.name} 👋</h1>
      <p className="text-zinc-400">Moduli za radnike (narudžbe uživo, zatvaranje smjene, popis, prijave) dolaze u sljedećim koracima.</p>
    </div>
  );
}
