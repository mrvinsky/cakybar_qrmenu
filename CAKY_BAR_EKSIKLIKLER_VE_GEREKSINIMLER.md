# CAKY BAR — Sistem Mimarisi, Eksiklikler ve Güncel Gereksinimler Raporu

Bu belge, **CAKY BAR** işletim sistemi için iç yönetim operasyonlarının yanı sıra **Müşteri QR Menüsü, Masadan Sipariş ve Garsonlar İçin Gerçek Zamanlı PWA Bildirim Sistemi** gereksinimlerini içeren güncel durum analizidir.

---

## 1. Sistem İstemleri ve Karşılanma Durumu (Gereksinim Matrisi)

| # | Modül / Gereksinim | İstenen Özellikler | Mevcut Durum | Eksiklik Seviyesi |
|---|---|---|---|---|
| **1** | **Kullanıcı Rolleri (RBAC)** | Admin (tam yetki) ve Radnik (kısıtlı yetki, finans & geçmiş gizli) | Temel JWT & Middleware kontrolü var | 🟡 Orta (Granular yetkiler ve sunucu kontrolleri) |
| **2** | **Giriş (Auth) Sistemi** | Kullanıcı adı/email, şifre, Beni Hatırla, parola sıfırlama, hesap dondurma | Giriş & Çıkış API'si var | 🟡 Orta (Şifre sıfırlama, kullanıcı dondurma UI/API) |
| **3** | **Admin Dashboard** | Ciro, pazar, stok uyarıları, son popis, farklar, beklenen alım, aktiviteler | Temel kartlar, haftalık ciro grafiği ve audit log var | 🟢 İyi (Popis farkları ve sipariş beklentisi kartları) |
| **4** | **Dnevni Pazar (Günlük Ciro)** | Nakit/kart, vardiya, otomatik toplam, gün/hafta/ay/yıl filtreleri, radnik kısıtlaması | Admin tarafı CRUD ve özet hazır | 🟢 İyi (Radnik vardiya kapanış formu) |
| **5** | **Inventar (Ürünler & Stok)** | Ad, kategori, birim, min/opt/maks stok, tedarikçi, alış/satış fiyatı, aktif/pasif | Temel CRUD ve filtreleme var | 🟡 Orta (Alış/satış fiyatları ve optimal stok) |
| **6** | **Popis (Envanter Sayımı - Admin)** | Yeni sayım açma, kilitleme, önceki sayımla karşılaştırma, fark ve tüketim hesabı | Sadece boş taslak sayfa | 🔴 Kritik (%100 Eksik) |
| **7** | **Popis (Radnik Arayüzü)** | Sade mobil sayım girişi, geçmişi görememe, sayım kilitleme yetkisinin olmaması | Sadece ürün arama listesi | 🔴 Kritik (%90 Eksik) |
| **8** | **Nabavka (Satın Alma)** | Min. stoğa ve bildirimlere göre otomatik liste, tedarikçi atama, fatura/fiyat, stoğa aktarım | Sadece boş taslak sayfa | 🔴 Kritik (%100 Eksik) |
| **9** | **Radnik İhtiyaç Bildirimi** | "Pri kraju", "Nedostaje", "Hitno", vardiyalar arası mükerrer bildirim engeli | Bildirim API ve formu yapıldı | 🟢 İyi (2. vardiyanın 1. vardiya notlarını görmesi) |
| **10** | **Bildirim Merkezi** | Kritik stok, yeni pazar, biten popis ve anomaliler için anlık bildirimler | DB ve basit okundu API'si var | 🟡 Orta (Popis/Alım tetikleyicileri) |
| **11** | **Izveštaji (Raporlar)** | Finansal, tüketim, fire/kayıp, tedarikçi raporları, PDF & Excel/CSV export | Sadece boş taslak sayfa | 🔴 Kritik (%100 Eksik) |
| **12** | **Dobavljači (Tedarikçiler)** | Firma adı, yetkili, telefon, e-posta, adres, ürün eşleme, alım geçmişi | Listeleme ve ekleme var | 🟡 Orta (Detaylı alanlar, güncelleme ve sipariş geçmişi) |
| **13** | **Katalog & Kategori Yönetimi** | Kategori ekleme, ürün düzenleme, pasife alma (soft-delete) | Kategori ve ürün ekleme var | 🟡 Orta (Ürün güncelleme ve pasife alma modalları) |
| **14** | **Zaposleni (Personel Yönetimi)** | Kullanıcı ekleme, şifre değiştirme, rol atama, dondurma | Ekleme ve listeleme var | 🟡 Orta (Şifre değiştirme ve statü güncelleme API) |
| **15** | **Audit Log (Denetim İzi)** | Kim, ne zaman, hangi veriyi değiştirdi (stok, popis, pazar) | Tablo ve gösterim ekranı hazır | 🟢 İyi |
| **16** | **PWA & Mobil Altyapı** | Mobilde tam ekran SaaS hissi, manifest, dokunmatik optimizasyon | Manifest ve mobil alt menü hazır | 🟢 İyi |
| **17** | **⭐ Dijital QR Menü & Masadan Sipariş (YENİ)** | Müşterinin masadaki QR kodla menüyü görmesi, masasını seçip sepete ekleyerek sipariş vermesi | Henüz eklenmedi | 🔴 Yeni İster (%100 Yapılacak) |
| **18** | **⭐ Garson PWA Canlı Bildirim Sistemi (YENİ)** | Masadan sipariş verildiğinde garson/barmenin telefonuna anlık sesli ve görsel bildirim düşmesi | Henüz eklenmedi | 🔴 Yeni İster (%100 Yapılacak) |

---

## 2. Genişletilmiş Veritabanı Mimarisi (Prisma DB Schema)

Mevcut şemaya eklenecek yeni modeller ve alanlar:

```prisma
// ==================== YENİ MASALAR VE SİPARİŞ MODELLERİ ====================

model Table {
  id          String    @id @default(uuid())
  number      Int       @unique               // Masa numarası (örn: 1, 2, 3...)
  name        String?                         // "Teras 1", "Bar Önü 2" vb.
  qrCode      String?                         // Özel QR kod bağlantısı
  active      Boolean   @default(true)
  orders      Order[]
}

model Order {
  id          String      @id @default(uuid())
  tableId     String
  status      String      @default("PENDING") // PENDING (Yeni), PREPARING (Hazırlanıyor), SERVED (Teslim), PAID (Ödendi), CANCELLED
  totalAmount Float       @default(0)
  notes       String?                         // Müşteri notu: "Buzsuz olsun", "Az şekerli"
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  table       Table       @relation(fields: [tableId], references: [id])
  items       OrderItem[]
}

model OrderItem {
  id          String    @id @default(uuid())
  orderId     String
  productId   String
  quantity    Int       @default(1)
  unitPrice   Float
  subtotal    Float
  
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])
}

// ==================== ÜRÜN & TEDARİKÇİ GÜNCELLEMELERİ ====================

model Product {
  // Mevcut alanlara eklenenler:
  costPrice       Float?    @default(0)   // Alış fiyatı (Nabavna cena)
  sellingPrice    Float?    @default(0)   // Satış fiyatı (Menü fiyatı - Prodajna cena)
  optimalQuantity Float?    @default(0)   // İdeal stok miktarı
  imageUrl        String?                 // QR Menüde gösterilecek ürün fotoğrafı
  description     String?                 // Ürün açıklaması (Menü için)
  isAvailable     Boolean   @default(true)// Menüde açık/kapalı kontrolü
  
  orderItems      OrderItem[]
}

model Supplier {
  // Mevcut alanlara eklenenler:
  email           String?                  // E-posta adresi
  address         String?                  // Tedarikçi adresi
  notes           String?                  // Özel notlar
}

model StockCountItem {
  @@unique([stockCountId, productId])     // Mükerrer sayım kaydını engeller
}
```

---

## 3. Eksik ve Yeni Eklenecek Backend API Rotaları

### A. Müşteri QR Menü & Masadan Sipariş API'leri (YENİ):
* `src/app/api/menu/route.ts`
  - `GET`: Müşterilere gösterilecek kategorize ürün listesi (Sadece aktif ve fiyatı olan ürünler; `OUT_OF_STOCK` ürünler "Tükendi" rozetiyle gelir).
* `src/app/api/menu/tables/route.ts`
  - `GET`: Mevcut masa listesi (Müşteri QR ile gelmediyse masasını seçmesi için).
* `src/app/api/menu/order/route.ts`
  - `POST`: Müşterinin masadan sipariş oluşturması. Doğrulama, toplam tutar hesabı ve garsonlara gerçek zamanlı bildirim tetikleyicisi.

### B. Garson Canlı Sipariş & PWA Bildirim API'leri (YENİ):
* `src/app/api/worker/orders/route.ts`
  - `GET`: Aktif bekleyen ve hazırlanan masa siparişleri listesi.
* `src/app/api/worker/orders/[id]/route.ts`
  - `PATCH`: Sipariş durumunu güncelleme (`PENDING` -> `PREPARING` -> `SERVED` -> `PAID`).
* `src/app/api/worker/orders/live/route.ts`
  - `GET`: **Server-Sent Events (SSE) / Canlı Akış:** Yeni sipariş geldiğinde garsonun telefonuna anında sinyal gönderen canlı yayın kanalı.

### C. Popis, Nabavka & Diğer Eksik API'ler:
* `src/app/api/admin/stock-counts/route.ts` *(GET/POST)*
* `src/app/api/admin/stock-counts/[id]/route.ts` *(GET fark hesabı)*
* `src/app/api/admin/stock-counts/[id]/lock/route.ts` *(POST kilitleme & stoğu eşitleme)*
* `src/app/api/admin/purchases/route.ts` & `suggestions/route.ts` *(Otomatik sipariş motoru)*
* `src/app/api/admin/reports/sales/route.ts` & `export/route.ts` *(Satış analizleri & CSV indirme)*
* `src/app/api/admin/users/[id]/route.ts` *(Kullanıcı dondurma / şifre sıfırlama)*

---

## 4. Eksik ve Yeni Eklenecek Frontend Sayfaları

### Müşteri Arayüzü:
* 🌟 `src/app/menu/page.tsx`
  - Modern, şık, mobil uyumlu Dijital QR Menü.
  - Kategori filtreleri (Kahveler, Alkollü İçecekler, Kokteyller, Atıştırmalıklar).
  - Tükendi rozetleri ve ürün detayları.
  - Masaya özel sepet modalı: Masa seçimi, müşteri notu ekleme ("Lütfen buzsuz gelsin"), tek tıkla "Sipariş Ver" butonu.

### Garson / Çalışan Arayüzü:
* 🌟 `src/app/(worker)/canli-siparisler/page.tsx` (veya alt menü sekmesi)
  - Mutfak/Bar Sipariş Ekranı (KDS benzeri).
  - **Sesli & Görsel PWA Bildirimi:** Masa 3 yeni sipariş verdiğinde garsonun cebinde çalacak sesli uyarı ("Dıng! Masa 3: 2x Bira, 1x Su").
  - "Hazırlanıyor" ve "Masaya Götürüldü" butonları.
* 🔴 `src/app/(worker)/moj-rad/page.tsx` *(404 veren eksik sayfa)*
* 🔴 `src/app/(worker)/popis-radnik/page.tsx` *(Gerçek sayım giriş ekranı)*

### Admin Arayüzü:
* 🔴 `src/app/(admin)/popis/page.tsx` *(Popis karşılaştırma ekranı)*
* 🔴 `src/app/(admin)/nabavka/page.tsx` *(Akıllı satın alma motoru)*
* 🔴 `src/app/(admin)/dobavljaci/page.tsx` *(Tedarikçi kartları)*
* 🔴 `src/app/(admin)/izvestaji/page.tsx` *(Raporlar ve grafikler)*
* 🔴 `src/app/(admin)/podesavanja/page.tsx` *(Masaları yönetme, QR kod üretme, bar ayarları)*

---

## 5. PWA (Progressive Web App) Bildirim Mimarisi Nasıl Çalışacak?

```
[Müşteri Masada]
      │
      │ 1. QR Kod Okutur & Sipariş Verir (/menu?table=4)
      ▼
[Next.js Backend API]
      │
      │ 2. Siparişi DB'ye Kaydeder (Status: PENDING)
      │ 3. Gerçek Zamanlı Kanala Sinyal Gönderir (SSE / Live Event)
      ▼
[Garsonun Telefonu / PWA]
      │
      ├── 🔔 Sesli Uyarı Çalar (Özel sipariş zili)
      ├── 📱 Ekranda Titreşimli Pop-up Açılır: "Masa 4 - Yeni Sipariş!"
      └── 📋 Tek tıkla "Hazırlanıyor" veya "Teslim Edildi" işaretlenir.
```
