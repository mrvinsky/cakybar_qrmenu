"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  createPurchasesFromSuggestionsAction,
  deletePurchaseAction,
  receivePurchaseAction,
} from "@/app/actions/nabavka";
import { Badge, Stat } from "@/components/Shell";

type TenantInfo = {
  name: string;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
};

type Product = {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  optimalQuantity: number;
  costPrice: number;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  category: { name: string } | null;
};

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  contactPerson: string | null;
  email: string | null;
  address: string | null;
};

type NeedReportItem = {
  id: string;
  productId: string;
  level: string;
  note: string | null;
  userName: string;
};

type PurchaseRecord = {
  id: string;
  status: string;
  invoiceNo: string | null;
  totalAmount: number;
  createdAt: string;
  receivedAt: string | null;
  supplierName: string;
  supplierPhone: string | null;
  supplierContact: string | null;
  supplierEmail: string | null;
  supplierAddress: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    unit: string;
  }[];
};

type DraftRow = {
  selected: boolean;
  supplierId: string;
  quantity: number;
  unitPrice: number;
};

/**
 * Sırpça/Boşnakça/Hırvatça özel karakterlerini (č, ć, š, ž, đ)
 * standart jsPDF Helvetica fontunda bozulmaması için temizler.
 */
function asciiSafe(str: string): string {
  return str
    .replace(/č/g, "c")
    .replace(/Č/g, "C")
    .replace(/ć/g, "c")
    .replace(/Ć/g, "C")
    .replace(/š/g, "s")
    .replace(/Š/g, "S")
    .replace(/ž/g, "z")
    .replace(/Ž/g, "Z")
    .replace(/đ/g, "dj")
    .replace(/Đ/g, "Dj");
}

function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (url.startsWith("data:image/")) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Kafe logosu, kafe bilgileri, tedarikçi bilgileri ve sipariş kalemlerini içeren
 * kurumsal A4 Sipariş Fişi (Narudžbenica) PDF dosyasını üretir.
 */
async function buildPurchaseOrderPdf(
  tenant: TenantInfo,
  pur: PurchaseRecord
): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const orderCode = pur.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(pur.createdAt).toLocaleDateString("sr-Latn");

  // Üst koyu kurumsal başlık bandı
  doc.setFillColor(18, 18, 22);
  doc.rect(0, 0, 210, 44, "F");
  doc.setFillColor(245, 158, 11); // Amber altın şerit
  doc.rect(0, 44, 210, 2, "F");

  // Logo (varsa resmi çiz, yoksa altın amblem kutusu çiz)
  let logoDrawn = false;
  if (tenant.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(tenant.logoUrl);
    if (dataUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, 8, 26, 26, 3, 3, "F");
        doc.addImage(dataUrl, "PNG", 15.5, 9.5, 23, 23);
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }
  }
  if (!logoDrawn) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(14, 8, 26, 26, 4, 4, "F");
    doc.setTextColor(18, 18, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    const initials = asciiSafe(tenant.name).slice(0, 2).toUpperCase();
    doc.text(initials, 27, 24, { align: "center" });
  }

  // Kafe Adı ve İletişim Bilgileri (Sol Üst)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(asciiSafe(tenant.name.toUpperCase()), 45, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 210);
  const metaLines: string[] = [];
  if (tenant.address) metaLines.push(`Adresa: ${asciiSafe(tenant.address)}`);
  if (tenant.contactPhone) metaLines.push(`Tel: ${tenant.contactPhone}`);
  if (tenant.contactEmail) metaLines.push(`Email: ${tenant.contactEmail}`);
  if (metaLines.length === 0) metaLines.push("Zvanična narudžbenica robe za ugostiteljski objekat");
  metaLines.forEach((line, idx) => {
    doc.text(line, 45, 22 + idx * 4.5);
  });

  // Sağ Üst: NARUDZBENICA Başlığı & Kod
  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("NARUDZBENICA", 196, 16, { align: "right" });

  doc.setTextColor(230, 230, 235);
  doc.setFontSize(10);
  doc.text(`Br: #NAR-${orderCode}`, 196, 23, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Datum: ${dateStr}`, 196, 28.5, { align: "right" });
  doc.text(
    `Status: ${pur.status === "RECEIVED" ? "PRIMLJENO" : "ZA ISPORUKU"}`,
    196,
    34,
    { align: "right" }
  );

  // Tedarikçi ve Alıcı Bilgi Kutuları (Y = 54)
  doc.setFillColor(246, 247, 249);
  doc.setDrawColor(220, 222, 228);
  doc.roundedRect(14, 54, 88, 30, 2, 2, "FD");
  doc.roundedRect(108, 54, 88, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 124, 135);
  doc.text("DOBAVLJAC (PRIMALAC NARUDZBE):", 18, 60);
  doc.text("NARUCILAC (ISPORUKA ZA OBJEKAT):", 112, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 25);
  doc.text(asciiSafe(pur.supplierName), 18, 67);
  doc.text(asciiSafe(tenant.name), 112, 67);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 74, 84);
  let supY = 72.5;
  if (pur.supplierContact) {
    doc.text(`Kontakt: ${asciiSafe(pur.supplierContact)}`, 18, supY);
    supY += 4.2;
  }
  if (pur.supplierPhone) {
    doc.text(`Tel / WhatsApp / Viber: ${pur.supplierPhone}`, 18, supY);
    supY += 4.2;
  }
  if (pur.supplierAddress) {
    doc.text(`Adresa: ${asciiSafe(pur.supplierAddress)}`, 18, supY);
  }

  let tenY = 72.5;
  if (tenant.address) {
    doc.text(`Adresa: ${asciiSafe(tenant.address)}`, 112, tenY);
    tenY += 4.2;
  }
  if (tenant.contactPhone) {
    doc.text(`Kontakt tel: ${tenant.contactPhone}`, 112, tenY);
    tenY += 4.2;
  }
  if (tenant.contactEmail) {
    doc.text(`Email: ${tenant.contactEmail}`, 112, tenY);
  }

  // Ürün Tablosu Başlığı (Y = 92)
  let y = 92;
  doc.setFillColor(24, 24, 28);
  doc.rect(14, y, 182, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text("#", 18, y + 6);
  doc.text("NAZIV ARTIKLA / ROBE", 28, y + 6);
  doc.text("JEDINICA", 112, y + 6);
  doc.text("KOLICINA", 142, y + 6, { align: "right" });
  doc.text("CIJENA (EUR)", 168, y + 6, { align: "right" });
  doc.text("UKUPNO (EUR)", 193, y + 6, { align: "right" });

  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  pur.items.forEach((it, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 249, 251);
      doc.rect(14, y, 182, 8.5, "F");
    }
    doc.setDrawColor(232, 234, 238);
    doc.line(14, y + 8.5, 196, y + 8.5);

    doc.setTextColor(30, 30, 36);
    doc.text(String(idx + 1), 18, y + 5.8);
    doc.setFont("helvetica", "bold");
    doc.text(asciiSafe(it.productName), 28, y + 5.8);
    doc.setFont("helvetica", "normal");
    doc.text(asciiSafe(it.unit), 112, y + 5.8);
    doc.setFont("helvetica", "bold");
    doc.text(`${it.quantity} ${asciiSafe(it.unit)}`, 142, y + 5.8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(it.unitPrice.toFixed(2), 168, y + 5.8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text((it.quantity * it.unitPrice).toFixed(2), 193, y + 5.8, { align: "right" });

    y += 8.5;
  });

  // Genel Toplam Kutusu
  y += 5;
  doc.setFillColor(24, 24, 28);
  doc.roundedRect(122, y, 74, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(210, 210, 220);
  doc.text("UKUPAN IZNOS:", 127, y + 7.5);
  doc.setFontSize(12);
  doc.setTextColor(245, 158, 11);
  doc.text(`EUR ${pur.totalAmount.toFixed(2)}`, 192, y + 7.8, { align: "right" });

  // Alt Kaşe / İmza Alanı
  const signY = Math.min(265, Math.max(y + 28, 225));
  doc.setDrawColor(180, 184, 195);
  doc.line(14, signY, 78, signY);
  doc.line(132, signY, 196, signY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 114, 125);
  doc.text(`Za ${asciiSafe(tenant.name)} (Naručilac)`, 14, signY + 5);
  doc.text(`Za ${asciiSafe(pur.supplierName)} (Isporucilac)`, 132, signY + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(150, 154, 165);
  doc.text(
    `Automatski generisana PDF narudžbenica · ${asciiSafe(tenant.name)} · #NAR-${orderCode}`,
    105,
    287,
    { align: "center" }
  );

  const filename = `Narudzbenica_${asciiSafe(tenant.name).replace(/\s+/g, "_")}_${asciiSafe(
    pur.supplierName
  ).replace(/\s+/g, "_")}_${orderCode}.pdf`;

  return { blob: doc.output("blob"), filename };
}

export function NabavkaClient({
  slug,
  tenantInfo,
  products,
  suppliers,
  openReports,
  purchases,
}: {
  slug: string;
  tenantInfo: TenantInfo;
  products: Product[];
  suppliers: Supplier[];
  openReports: NeedReportItem[];
  purchases: PurchaseRecord[];
}) {
  const reportMap = new Map<string, NeedReportItem>();
  for (const r of openReports) {
    if (!reportMap.has(r.productId)) reportMap.set(r.productId, r);
  }

  // Otomatik önerilen ürünler: stok <= minStok VEYA çalışan bildirimi olanlar
  const suggestedProducts = products.filter(
    (p) => p.currentQuantity <= p.minQuantity || reportMap.has(p.id)
  );

  const initialDrafts: Record<string, DraftRow> = {};
  for (const p of products) {
    const isSuggested = p.currentQuantity <= p.minQuantity || reportMap.has(p.id);
    const needed = Math.max(
      1,
      Number(((p.optimalQuantity || p.minQuantity * 2 || 10) - p.currentQuantity).toFixed(1))
    );
    initialDrafts[p.id] = {
      selected: isSuggested,
      supplierId: p.supplierId ?? "",
      quantity: needed,
      unitPrice: p.costPrice,
    };
  }

  const [drafts, setDrafts] = useState<Record<string, DraftRow>>(initialDrafts);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const displayedProducts = showAllProducts ? products : suggestedProducts;

  const selectedList = products.filter((p) => drafts[p.id]?.selected && drafts[p.id]?.quantity > 0);
  const estimatedTotal = selectedList.reduce(
    (s, p) => s + drafts[p.id].quantity * drafts[p.id].unitPrice,
    0
  );

  const updateDraft = (productId: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }));
  };

  const handleCreateOrders = async () => {
    if (selectedList.length === 0 || creating) return;
    setCreating(true);
    try {
      await createPurchasesFromSuggestionsAction(
        slug,
        selectedList.map((p) => ({
          productId: p.id,
          supplierId: drafts[p.id].supplierId || null,
          quantity: drafts[p.id].quantity,
          unitPrice: drafts[p.id].unitPrice,
        }))
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadPdf = async (pur: PurchaseRecord) => {
    const { blob, filename } = await buildPurchaseOrderPdf(tenantInfo, pur);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`📄 PDF narudžbenica (${filename}) je preuzeta.`);
    setTimeout(() => setToast(null), 4500);
  };

  const handleSendPdfMessenger = async (
    pur: PurchaseRecord,
    channel: "WHATSAPP" | "VIBER"
  ) => {
    const { blob, filename } = await buildPurchaseOrderPdf(tenantInfo, pur);
    const orderCode = pur.id.slice(0, 8).toUpperCase();
    const file = new File([blob], filename, { type: "application/pdf" });

    const summaryText = [
      `📦 *NARUDŽBENICA #NAR-${orderCode} — ${tenantInfo.name}*`,
      `Dobavljač: ${pur.supplierName}`,
      `Datum: ${new Date(pur.createdAt).toLocaleDateString("sr-Latn")}`,
      ``,
      `Stavke za isporuku:`,
      ...pur.items.map(
        (it, i) => `${i + 1}. ${it.productName} — *${it.quantity} ${it.unit}*`
      ),
      ``,
      `Ukupno: €${pur.totalAmount.toFixed(2)}`,
      `(U prilogu je zvanična PDF narudžbenica sa logotipom objekta)`,
    ].join("\n");

    // Mobil cihazlarda Web Share API ile PDF dosyasını doğrudan WhatsApp / Viber uygulamasında paylaş
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Narudžbenica #NAR-${orderCode} - ${tenantInfo.name}`,
          text: summaryText,
          files: [file],
        });
        return;
      } catch {
        // Kullanıcı paylaşımı kapattıysa veya masaüstündeyse aşağıdaki akışa geç
      }
    }

    // PDF dosyasını otomatik indir + WhatsApp / Viber sohbet penceresini tedarikçinin numarasıyla aç
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    const digits = cleanPhoneNumber(pur.supplierPhone);
    if (channel === "WHATSAPP") {
      const waUrl = digits
        ? `https://wa.me/${digits}?text=${encodeURIComponent(summaryText)}`
        : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setToast(
        `🟢 PDF narudžbenica je preuzeta, a WhatsApp razgovor sa dobavljačem je otvoren — samo prevucite preuzeti PDF u chat!`
      );
    } else {
      try {
        await navigator.clipboard.writeText(summaryText);
      } catch {
        // ignore
      }
      const viberUrl = digits
        ? `viber://chat?number=%2B${digits}`
        : `viber://forward?text=${encodeURIComponent(summaryText)}`;
      window.location.href = viberUrl;
      setToast(
        `🟣 PDF narudžbenica je preuzeta i Viber chat sa dobavljačem se otvara — priložite preuzeti PDF fajl u razgovor!`
      );
    }
    setTimeout(() => setToast(null), 6000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-300">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-4 rounded bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300"
          >
            OK
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pametna Nabavka</h1>
          <p className="text-sm text-zinc-400">
            Automatski prijedlog nabavke, generisanje PDF narudžbenice sa logotipom kafića i slanje dobavljaču na WhatsApp / Viber
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllProducts((v) => !v)}
          className="btn-ghost"
        >
          {showAllProducts
            ? `Prikaži samo kritične (${suggestedProducts.length})`
            : `Prikaži sve artikle (${products.length})`}
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Za nabavku (predloženo)"
          value={suggestedProducts.length}
          hint="Ispod minimuma ili prijavljeno"
        />
        <Stat
          label="Prijave radnika"
          value={openReports.length}
          hint="Hitno / Nedostaje / Pri kraju"
        />
        <Stat
          label="Procijenjeni trošak"
          value={`€${estimatedTotal.toFixed(2)}`}
          hint={`${selectedList.length} odabranih stavki`}
        />
        <Stat
          label="Čeka isporuku"
          value={purchases.filter((p) => p.status === "ORDERED").length}
          hint="Aktivne narudžbenice"
        />
      </div>

      {/* BÖLÜM 1: OTOMATİK SATIN ALMA LİSTESİ */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="font-bold">1. Lista za nabavku (Predlozi do optimalne zalihe)</h2>
            <p className="text-xs text-zinc-400">
              Prilagodite količinu, dobavljača ili nabavnu cijenu i kreirajte narudžbenice jednim klikom
            </p>
          </div>
          <button
            type="button"
            disabled={selectedList.length === 0 || creating}
            onClick={handleCreateOrders}
            className="btn"
          >
            {creating
              ? "Kreiram..."
              : `Kreiraj narudžbenicu (${selectedList.length} stavki · €${estimatedTotal.toFixed(2)}) →`}
          </button>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">
            🎉 Sve zalihe su iznad minimuma i nema aktivnih prijava radnika! Kliknite na „Prikaži sve artikle“ ako želite ručno kreirati nabavku.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 text-left text-xs text-zinc-400">
                <tr>
                  <th className="p-2.5">Uključi</th>
                  <th>Artikal</th>
                  <th>Stanje / Min / Opt</th>
                  <th>Razlog</th>
                  <th>Dobavljač</th>
                  <th>Za naručiti</th>
                  <th>Nabavna (€)</th>
                  <th className="p-2.5 text-right">Ukupno</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const d = drafts[p.id];
                  const rep = reportMap.get(p.id);
                  const isLow = p.currentQuantity <= p.minQuantity;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-zinc-800/60 ${
                        d?.selected ? "bg-amber-500/5" : "opacity-60"
                      }`}
                    >
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={d?.selected ?? false}
                          onChange={(e) =>
                            updateDraft(p.id, { selected: e.target.checked })
                          }
                        />
                      </td>
                      <td className="font-bold text-white">{p.name}</td>
                      <td className="font-mono text-xs">
                        <span className={isLow ? "font-bold text-red-400" : "text-zinc-300"}>
                          {p.currentQuantity} {p.unit}
                        </span>{" "}
                        <span className="text-zinc-500">
                          (min {p.minQuantity} · opt {p.optimalQuantity})
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {isLow && <Badge tone="red">Ispod min.</Badge>}
                          {rep && (
                            <Badge
                              tone={
                                rep.level === "HITNO"
                                  ? "red"
                                  : rep.level === "NEDOSTAJE"
                                  ? "amber"
                                  : "zinc"
                              }
                            >
                              {rep.level} ({rep.userName})
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={d?.supplierId ?? ""}
                          onChange={(e) =>
                            updateDraft(p.id, { supplierId: e.target.value })
                          }
                          className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs"
                        >
                          <option value="">— Bez dobavljača —</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            value={d?.quantity ?? 0}
                            onChange={(e) =>
                              updateDraft(p.id, {
                                quantity: Math.max(0, Number(e.target.value)),
                                selected: true,
                              })
                            }
                            className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 font-mono text-xs font-bold text-amber-400"
                          />
                          <span className="text-xs text-zinc-500">{p.unit}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={d?.unitPrice ?? 0}
                          onChange={(e) =>
                            updateDraft(p.id, {
                              unitPrice: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 font-mono text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono text-xs font-bold text-amber-400">
                        €{((d?.quantity ?? 0) * (d?.unitPrice ?? 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BÖLÜM 2: OLUŞTURULAN SATIN ALMA FİŞLERİ, LOGOLU PDF İNDİRME VE WHATSAPP/VIBER GÖNDERİMİ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          2. Narudžbenice, PDF sa logom kafića i slanje dobavljaču ({purchases.length})
        </h2>
        {purchases.length === 0 ? (
          <div className="card py-10 text-center text-sm text-zinc-500">
            Još nema kreiranih narudžbenica.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {purchases.map((pur) => {
              const isReceived = pur.status === "RECEIVED";
              return (
                <div
                  key={pur.id}
                  className="card flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-base font-extrabold text-white">
                          📦 {pur.supplierName}
                        </div>
                        <div className="text-xs text-zinc-400">
                          Kreirano: {new Date(pur.createdAt).toLocaleString("sr-Latn")}
                          {pur.supplierPhone && ` · 📞 ${pur.supplierPhone}`}
                          {pur.invoiceNo && ` · Faktura: #${pur.invoiceNo}`}
                        </div>
                      </div>
                      <Badge tone={isReceived ? "green" : "amber"}>
                        {isReceived ? "✓ PRIMLJENO NA STANJE" : "⏳ ČEKA ISPORUKU"}
                      </Badge>
                    </div>

                    {/* PDF Narudžbenica + WhatsApp / Viber Tek Tuşla Gönderim Barı */}
                    <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(pur)}
                        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 hover:border-amber-500/50"
                      >
                        📄 PDF Narudžbenica (sa logom)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPdfMessenger(pur, "WHATSAPP")}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
                      >
                        🟢 Pošalji PDF na WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendPdfMessenger(pur, "VIBER")}
                        className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/25"
                      >
                        🟣 Pošalji PDF na Viber
                      </button>
                    </div>

                    <ul className="mt-3 divide-y divide-zinc-800/80 text-xs">
                      {pur.items.map((it) => (
                        <li key={it.id} className="flex justify-between py-1.5">
                          <span>
                            <strong className="text-amber-400">
                              +{it.quantity} {it.unit}
                            </strong>{" "}
                            {it.productName}
                          </span>
                          <span className="font-mono text-zinc-400">
                            €{(it.quantity * it.unitPrice).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Ukupan iznos:</span>
                      <span className="font-mono text-lg font-black text-amber-400">
                        €{pur.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    {!isReceived ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <form
                          action={receivePurchaseAction.bind(null, slug, pur.id)}
                          className="flex flex-1 gap-2"
                        >
                          <input
                            name="invoiceNo"
                            placeholder="Br. fakture / otpremnice"
                            className="input text-xs"
                          />
                          <button className="btn whitespace-nowrap text-xs">
                            ✓ Potvrdi prijem (Dodaj na stanje)
                          </button>
                        </form>
                        <form action={deletePurchaseAction.bind(null, slug, pur.id)}>
                          <button className="btn-ghost text-xs text-red-400">
                            Otkaži
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400">
                        ✓ Roba primljena i dodata u inventar{" "}
                        {pur.receivedAt &&
                          `(${new Date(pur.receivedAt).toLocaleDateString("sr-Latn")})`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
