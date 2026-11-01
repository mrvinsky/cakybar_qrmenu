"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "sr" | "tr";

const translations = {
  sr: {
    // Navigation
    overview: "Pregled",
    tenants: "Objekti (kafići)",
    plans: "Planovi",
    auditLog: "Audit log",
    platformTitle: "BarOS Platforma",
    logout: "Odjava",
    changePassword: "Promijeni lozinku",
    supportBanner: "Podrška: prijavljeni ste kao korisnik ovog objekta.",
    returnToPlatform: "Vrati se na platformu",

    // Dashboard
    platformOverview: "Pregled platforme",
    totalTenants: "Ukupno objekata",
    activeCount: "aktivnih",
    suspendedCount: "suspendovanih",
    estimatedMrr: "MRR (procjena)",
    activeAndPaid: "Aktivni + plaćeni",
    paymentsThisMonth: "Uplate ovog mjeseca",
    usersAndOrders: "Korisnika / narudžbi (mj.)",
    expiringSubscriptions: "Pretplate koje ističu (7 dana)",
    noExpiringSubscriptions: "Nema pretplata pred istekom.",
    expired: "Isteklo",
    soon: "Uskoro",

    // Tenants page
    tenantsTitle: "Objekti",
    newTenant: "+ Novi objekat",
    tableColName: "Naziv",
    tableColSlug: "Slug",
    tableColQrMode: "QR Režim",
    tableColPlan: "Plan",
    tableColPayment: "Plaćanje",
    tableColExpires: "Ističe",
    tableColUsers: "Korisnici",
    tableColStatus: "Status",
    statusActive: "Aktivan",
    statusSuspended: "Suspendovan",
    qrTableOrdering: "Naručivanje sa stola",
    qrMenuOnly: "Samo meni",

    // Create Tenant Form
    formNewTenant: "Novi objekat",
    formName: "Naziv",
    formNamePlaceholder: "Caffe Bar Primjer",
    formSlug: "Slug (URL)",
    formSlugPlaceholder: "caffe-primjer",
    formQrType: "Tip QR menija",
    formQrOptionTable: "QR Meni + Naručivanje sa stola (poseban QR po stolu)",
    formQrOptionMenu: "Samo digitalni QR Meni (jedan QR bez naručivanja)",
    formPlan: "Plan",
    formNoPlan: "— bez plana —",
    formContactEmail: "Kontakt email",
    formAdminSection: "Admin nalog objekta",
    formAdminName: "Ime",
    formAdminEmail: "Email",
    formAdminPassword: "Lozinka",
    formCreateBtn: "Kreiraj",
    formCreating: "Kreiram...",
    formCancel: "Otkaži",
    formTrialNotice: "Novi objekat dobija 14 dana probnog perioda.",

    // Tenant Detail
    loginAsAdmin: "Prijavi se kao admin",
    suspendTenant: "Suspenduj",
    activateTenant: "Aktiviraj",
    tablesCount: "Stolovi",
    productsCount: "Proizvodi",
    ordersCount: "Narudžbe",
    subscriptionAndMode: "Pretplata i režim rada",
    qrModeLabel: "Tip QR menija (određuje vlasnik platforme)",
    paymentStatus: "Status plaćanja",
    validUntil: "Važi do",
    save: "Sačuvaj",
    recordPayment: "Evidentiraj uplatu",
    amountEur: "Iznos (€)",
    periodStart: "Od datuma",
    periodEnd: "Do datuma",
    method: "Metod",
    methodCash: "Gotovina",
    methodBank: "Virman / Banka",
    methodCard: "Kartica",
    methodOther: "Drugo",
    recordPaymentBtn: "Zabilježi uplatu",
    tenantUsers: "Korisnici objekta",
    addUser: "+ Dodaj korisnika",
    userActive: "Aktivan",
    userFrozen: "Zamrznut",
    deleteUser: "🗑 Obriši korisnika",
    paymentHistory: "Istorija uplata",
    noPayments: "Nema uplata.",

    // Plans page
    plansTitle: "Planovi pretplate",
    tenantsUsingPlan: "objekata koristi ovaj plan",
    planName: "Naziv",
    planPriceEur: "€/mjesečno",
    planMaxUsers: "Max korisnika",
    planMaxTables: "Max stolova",
    planFeatures: "Opis funkcija",
    planSave: "Sačuvaj",
    planAdd: "Dodaj plan",
    newPlanTitle: "Novi plan",

    // Audit page
    auditTitle: "Audit log (sve)",
    auditTime: "Vrijeme",
    auditTenant: "Objekat",
    auditUser: "Korisnik",
    auditAction: "Akcija",
    auditDetails: "Detalji",

    // Language switcher
    language: "Jezik",
    turkish: "Turski",
    serbian: "Srpski",
  },
  tr: {
    // Navigation
    overview: "Genel Bakış",
    tenants: "Kafeler & Barlar",
    plans: "Abonelik Planları",
    auditLog: "Sistem Günlüğü (Audit)",
    platformTitle: "BarOS Platform",
    logout: "Çıkış Yap",
    changePassword: "Şifre Değiştir",
    supportBanner: "Destek Modu: Bu işletmeye yönetici olarak bağlandınız.",
    returnToPlatform: "Platforma Geri Dön",

    // Dashboard
    platformOverview: "Platform Genel Bakışı",
    totalTenants: "Toplam İşletme",
    activeCount: "aktif",
    suspendedCount: "askıda",
    estimatedMrr: "Tahmini MRR",
    activeAndPaid: "Aktif + Ödeyen",
    paymentsThisMonth: "Bu Ayki Tahsilat",
    usersAndOrders: "Kullanıcı / Sipariş (Bu Ay)",
    expiringSubscriptions: "Aboneliği Bitenler (7 Gün)",
    noExpiringSubscriptions: "Süresi yaklaşan abonelik bulunmuyor.",
    expired: "Süresi Doldu",
    soon: "Yakında",

    // Tenants page
    tenantsTitle: "Kayıtlı İşletmeler",
    newTenant: "+ Yeni İşletme Ekle",
    tableColName: "İşletme Adı",
    tableColSlug: "Slug",
    tableColQrMode: "QR Modu",
    tableColPlan: "Plan",
    tableColPayment: "Ödeme",
    tableColExpires: "Bitiş Tarihi",
    tableColUsers: "Kullanıcılar",
    tableColStatus: "Durum",
    statusActive: "Aktif",
    statusSuspended: "Askıya Alındı",
    qrTableOrdering: "Masadan Sipariş",
    qrMenuOnly: "Sadece Menü",

    // Create Tenant Form
    formNewTenant: "Yeni İşletme Kaydı",
    formName: "İşletme Adı",
    formNamePlaceholder: "Örn: Caffe Bar İstanbul",
    formSlug: "Slug (URL Kodu)",
    formSlugPlaceholder: "caffe-istanbul",
    formQrType: "QR Menü Tipi",
    formQrOptionTable: "QR Menü + Masadan Sipariş (Her masa için ayrı QR)",
    formQrOptionMenu: "Sadece Dijital QR Menü (Tek genel QR, sepetsiz katalog)",
    formPlan: "Abonelik Planı",
    formNoPlan: "— Plan Seçilmedi —",
    formContactEmail: "İletişim E-postası",
    formAdminSection: "İşletme Yönetici (Admin) Hesabı",
    formAdminName: "Yönetici Adı",
    formAdminEmail: "Yönetici E-posta",
    formAdminPassword: "Şifre",
    formCreateBtn: "İşletmeyi Oluştur",
    formCreating: "Oluşturuluyor...",
    formCancel: "İptal",
    formTrialNotice: "Yeni oluşturulan işletmeye otomatik 14 gün deneme süresi verilir.",

    // Tenant Detail
    loginAsAdmin: "Yönetici Olarak Giriş Yap",
    suspendTenant: "Askıya Al",
    activateTenant: "Aktifleştir",
    tablesCount: "Masa Sayısı",
    productsCount: "Ürünler",
    ordersCount: "Siparişler",
    subscriptionAndMode: "Abonelik ve Çalışma Modu",
    qrModeLabel: "QR Menü Modu (Sadece Platform Sahibi Belirler)",
    paymentStatus: "Ödeme Durumu",
    validUntil: "Abonelik Bitiş Tarihi",
    save: "Kaydet",
    recordPayment: "Ödeme / Tahsilat Kaydet",
    amountEur: "Tutar (€)",
    periodStart: "Başlangıç Tarihi",
    periodEnd: "Bitiş Tarihi",
    method: "Ödeme Yöntemi",
    methodCash: "Nakit",
    methodBank: "Havale / Banka",
    methodCard: "Kredi Kartı",
    methodOther: "Diğer",
    recordPaymentBtn: "Ödemeyi Kaydet",
    tenantUsers: "İşletme Personeli & Kullanıcılar",
    addUser: "+ Kullanıcı Ekle",
    userActive: "Aktif",
    userFrozen: "Donduruldu",
    deleteUser: "🗑 Kullanıcıyı Sil",
    paymentHistory: "Tahsilat Geçmişi",
    noPayments: "Henüz ödeme kaydı yok.",

    // Plans page
    plansTitle: "Abonelik Planları",
    tenantsUsingPlan: "işletme bu planı kullanıyor",
    planName: "Plan Adı",
    planPriceEur: "€ / Aylık",
    planMaxUsers: "Maks. Kullanıcı",
    planMaxTables: "Maks. Masa",
    planFeatures: "Özellikler & Açıklama",
    planSave: "Kaydet",
    planAdd: "Plan Ekle",
    newPlanTitle: "Yeni Plan Ekle",

    // Audit page
    auditTitle: "Platform Sistem Günlüğü (Audit Log)",
    auditTime: "Zaman",
    auditTenant: "İşletme",
    auditUser: "Kullanıcı",
    auditAction: "İşlem",
    auditDetails: "Detaylar",

    // Language switcher
    language: "Dil Seçimi",
    turkish: "Türkçe",
    serbian: "Sırpça (Srpski)",
  },
};

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.sr;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "sr",
  setLang: () => {},
  t: translations.sr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("tr"); // Superadmin için varsayılan Türkçe

  useEffect(() => {
    try {
      const saved = localStorage.getItem("baros_platform_lang") as Language | null;
      if (saved && (saved === "sr" || saved === "tr")) {
        setLangState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("baros_platform_lang", newLang);
    } catch {
      // ignore
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
