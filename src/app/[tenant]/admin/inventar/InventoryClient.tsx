"use client";

import { useState } from "react";
import {
  saveCategoryAction,
  saveProductAction,
  toggleProductActiveAction,
  toggleProductAvailabilityAction,
} from "@/app/actions/catalog";
import { Badge, Stat } from "@/components/Shell";

type Category = { id: string; name: string; sortOrder: number };
type Supplier = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  categoryId: string | null;
  supplierId: string | null;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  optimalQuantity: number;
  costPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
  description: string | null;
  isAvailable: boolean;
  active: boolean;
  category: Category | null;
  supplier: Supplier | null;
};

export function InventoryClient({
  slug,
  products,
  categories,
  suppliers,
}: {
  slug: string;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "LOW" | "SOLD_OUT" | "ARCHIVED">("ACTIVE");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [catModal, setCatModal] = useState(false);

  const activeProducts = products.filter((p) => p.active);
  const lowStockCount = activeProducts.filter((p) => p.currentQuantity <= p.minQuantity).length;
  const stockValue = activeProducts.reduce((s, p) => s + p.currentQuantity * p.costPrice, 0);
  const menuActiveCount = activeProducts.filter((p) => p.isAvailable && p.sellingPrice > 0).length;

  const filtered = products.filter((p) => {
    if (statusFilter === "ARCHIVED" && p.active) return false;
    if (statusFilter !== "ARCHIVED" && !p.active) return false;
    if (statusFilter === "LOW" && p.currentQuantity > p.minQuantity) return false;
    if (statusFilter === "SOLD_OUT" && p.isAvailable && p.currentQuantity > 0) return false;
    if (catFilter !== "ALL" && p.categoryId !== catFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const openModal = creating || editing !== null;

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Aksiyonlar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventar & Katalog</h1>
          <p className="text-sm text-zinc-400">
            Zalihe, nabavne i prodajne cijene, kategorije i vidljivost na QR meniju
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCatModal(true)}
            className="btn-ghost"
          >
            + Kategorija
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="btn"
          >
            + Novi artikal
          </button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Aktivnih artikala" value={activeProducts.length} hint={`${categories.length} kategorija`} />
        <Stat label="Kritične zalihe" value={lowStockCount} hint="Ispod ili na minimumu" />
        <Stat label="Vrijednost magacina" value={`€${stockValue.toFixed(2)}`} hint="Po nabavnoj cijeni" />
        <Stat label="U prodaji na QR meniju" value={menuActiveCount} />
      </div>

      {/* Filtre Çubuğu */}
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "ACTIVE", label: `Svi aktivni (${activeProducts.length})` },
            { id: "LOW", label: `⚠️ Kritične zalihe (${lowStockCount})` },
            { id: "SOLD_OUT", label: "Rasprodato na meniju" },
            { id: "ARCHIVED", label: "Arhivirani" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as typeof statusFilter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === f.id
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="input w-44"
          >
            <option value="ALL">Sve kategorije</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži artikal..."
            className="input w-48"
          />
        </div>
      </div>

      {/* Ürün Tablosu */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
            <tr>
              <th className="p-3.5">Artikal</th>
              <th>Kategorija</th>
              <th>Dobavljač</th>
              <th>Stanje / Min / Opt</th>
              <th>Nabavna / Prodajna</th>
              <th>QR Meni</th>
              <th className="p-3.5 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isLow = p.currentQuantity <= p.minQuantity;
              const margin =
                p.sellingPrice > 0
                  ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                  : 0;

              return (
                <tr
                  key={p.id}
                  className="border-b border-zinc-800/60 hover:bg-zinc-800/25"
                >
                  <td className="p-3.5">
                    <div className="font-bold text-white">{p.name}</div>
                    {p.description && (
                      <div className="max-w-xs truncate text-xs text-zinc-500">
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td className="text-xs text-zinc-300">{p.category?.name ?? "—"}</td>
                  <td className="text-xs text-zinc-400">{p.supplier?.name ?? "—"}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold ${
                          isLow ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {p.currentQuantity} {p.unit}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        (min {p.minQuantity} · opt {p.optimalQuantity})
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">
                    <span className="text-zinc-400">€{p.costPrice.toFixed(2)}</span>
                    {" → "}
                    <span className="font-bold text-amber-400">
                      €{p.sellingPrice.toFixed(2)}
                    </span>
                    {margin > 0 && (
                      <span className="ml-1.5 text-[11px] text-emerald-400">
                        ({margin}%)
                      </span>
                    )}
                  </td>
                  <td>
                    <form
                      action={toggleProductAvailabilityAction.bind(
                        null,
                        slug,
                        p.id,
                        !p.isAvailable
                      )}
                    >
                      <button
                        type="submit"
                        className="cursor-pointer"
                        title="Klikni za promjenu dostupnosti na QR meniju"
                      >
                        <Badge tone={p.isAvailable ? "green" : "red"}>
                          {p.isAvailable ? "Dostupno" : "Rasprodato"}
                        </Badge>
                      </button>
                    </form>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setEditing(p);
                        }}
                        className="btn-ghost text-xs"
                      >
                        Uredi
                      </button>
                      <form
                        action={toggleProductActiveAction.bind(
                          null,
                          slug,
                          p.id,
                          !p.active
                        )}
                      >
                        <button className="btn-ghost text-xs">
                          {p.active ? "Arhiviraj" : "Vrati"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kategori Ekleme Modalı */}
      {catModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            action={async (fd) => {
              await saveCategoryAction(slug, fd);
              setCatModal(false);
            }}
            className="card w-full max-w-sm space-y-3.5 border-zinc-700 bg-zinc-950"
          >
            <h2 className="text-lg font-bold">Nova kategorija</h2>
            <div>
              <label className="label">Naziv kategorije *</label>
              <input
                name="name"
                required
                placeholder="npr. Topli napici, Kokteli, Deserti..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Redoslijed prikaza</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={categories.length + 1}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatModal(false)}
                className="btn-ghost"
              >
                Otkaži
              </button>
              <button className="btn">Sačuvaj</button>
            </div>
          </form>
        </div>
      )}

      {/* Ürün Ekleme / Düzenleme Modalı */}
      {openModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            action={async (fd) => {
              await saveProductAction(slug, fd);
              setCreating(false);
              setEditing(null);
            }}
            className="card max-h-[90vh] w-full max-w-xl space-y-3.5 overflow-y-auto border-zinc-700 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">
                {editing ? `Uredi artikal: ${editing.name}` : "Novi artikal"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Zatvori ✕
              </button>
            </div>

            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Naziv artikla *</label>
                <input
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  placeholder="npr. Espresso, Heineken 0.33L..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Kategorija</label>
                <select
                  name="categoryId"
                  defaultValue={editing?.categoryId ?? ""}
                  className="input"
                >
                  <option value="">— Bez kategorije —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Dobavljač</label>
                <select
                  name="supplierId"
                  defaultValue={editing?.supplierId ?? ""}
                  className="input"
                >
                  <option value="">— Bez dobavljača —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Nabavna cijena (€)</label>
                <input
                  name="costPrice"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.costPrice ?? 0}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Prodajna / Meni cijena (€)</label>
                <input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.sellingPrice ?? 0}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Jedinica mjere</label>
                <input
                  name="unit"
                  defaultValue={editing?.unit ?? "kom"}
                  placeholder="kom, boca, kg, l, šolja..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Trenutna količina na stanju</label>
                <input
                  name="currentQuantity"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.currentQuantity ?? 0}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Minimalna zaliha (alarm za nabavku)</label>
                <input
                  name="minQuantity"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.minQuantity ?? 10}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Optimalna zaliha (cilj za nabavku)</label>
                <input
                  name="optimalQuantity"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.optimalQuantity ?? 50}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Status na QR meniju</label>
                <select
                  name="isAvailable"
                  defaultValue={editing?.isAvailable === false ? "false" : "true"}
                  className="input"
                >
                  <option value="true">Dostupno (vidljivo u meniju)</option>
                  <option value="false">Rasprodato</option>
                </select>
              </div>

              <div>
                <label className="label">URL fotografije (opciono)</label>
                <input
                  name="imageUrl"
                  defaultValue={editing?.imageUrl ?? ""}
                  placeholder="/hero-dish.jpg ili https://..."
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Opis artikla za QR meni (opciono)</label>
                <input
                  name="description"
                  defaultValue={editing?.description ?? ""}
                  placeholder="npr. 100% Arabica sa kremastom mliječnom pjenom"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="btn-ghost"
              >
                Otkaži
              </button>
              <button className="btn">Sačuvaj artikal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
