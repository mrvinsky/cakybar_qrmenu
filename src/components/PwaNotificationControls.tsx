"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Yan menüde (veya üst barda) yer alan:
 * 1. Tarayıcı / Masaüstü / Mobil Web Bildirimlerini (Notification API) açma ve test etme butonu
 * 2. PWA "Uygulamayı Cihaza Yükle (Instaliraj aplikaciju)" butonu
 */
export function PwaNotificationControls() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPerm("unsupported");
    } else {
      setPerm(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setPerm(res);
    if (res === "granted") {
      try {
        if ("vibrate" in navigator) navigator.vibrate([120, 60, 120]);
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg && "showNotification" in reg) {
          await reg.showNotification("🔔 BarOS Notifikacije aktivne", {
            body: "Sada ćete primati instant obavještenja o novim narudžbama sa stolova.",
            icon: "/icon.svg",
            badge: "/icon.svg",
          });
        } else {
          new Notification("🔔 BarOS Notifikacije aktivne", {
            body: "Sada ćete primati instant obavještenja o novim narudžbama sa stolova.",
            icon: "/icon.svg",
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <div className="space-y-1.5">
      {perm !== "unsupported" && (
        <button
          type="button"
          onClick={requestNotifications}
          className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
            perm === "granted"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          }`}
        >
          {perm === "granted"
            ? "🔔 Web notifikacije: Uključene"
            : "🔔 Uključi web notifikacije"}
        </button>
      )}

      {installPrompt && !installed && (
        <button
          type="button"
          onClick={handleInstallPwa}
          className="w-full rounded-lg border border-amber-500/40 bg-amber-500 px-3 py-2 text-center text-xs font-extrabold text-zinc-950 transition hover:bg-amber-400"
        >
          📲 Instaliraj BarOS aplikaciju
        </button>
      )}
    </div>
  );
}

/**
 * Herhangi bir bileşenden (ör. yeni QR sipariş geldiğinde)
 * işletim sistemi / tarayıcı bildirimi + titreşim tetiklemek için yardımcı fonksiyon.
 */
export async function triggerSystemNotification(
  title: string,
  body: string,
  url = "/"
) {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg && "showNotification" in reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `baros-${Date.now()}`,
        data: { url },
      });
    } else {
      new Notification(title, {
        body,
        icon: "/icon.svg",
      });
    }
  } catch {
    // ignore
  }
}
