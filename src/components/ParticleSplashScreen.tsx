"use client";

import { useEffect, useRef, useState } from "react";

type SplashParticle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  delay: number;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Uygulama açılırken (veya PWA başlatıldığında) Hero bölümündeki gibi
 * altın/amber parçacıkların uzaydan süzülerek BarOS amblemini ve fincan siluetini
 * oluşturduğu, ardından yumuşak bir dağılmayla ekrana geçiş yaptığı açılış ekranı.
 */
export function ParticleSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Oturum başına bir kez göster (veya standalone PWA açılışında)
    try {
      const seen = sessionStorage.getItem("baros_splash_seen");
      if (seen === "1") return;
      sessionStorage.setItem("baros_splash_seen", "1");
    } catch {
      // ignore
    }
    setVisible(true);

    // Service Worker kaydını da burada başlat
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Offscreen tuvalde BarOS fincan + metin siluetini çizip piksellerini örnekle
    const off = document.createElement("canvas");
    const offW = 360;
    const offH = 260;
    off.width = offW;
    off.height = offH;
    const octx = off.getContext("2d");

    const targets: { x: number; y: number; color: string }[] = [];
    if (octx) {
      octx.clearRect(0, 0, offW, offH);

      // Buhar dalgaları
      octx.strokeStyle = "#fde68a";
      octx.lineWidth = 4;
      octx.lineCap = "round";
      [-28, 0, 28].forEach((dx, i) => {
        octx.beginPath();
        octx.moveTo(offW / 2 + dx, 62);
        octx.quadraticCurveTo(offW / 2 + dx - 10, 42, offW / 2 + dx + 6, 22 - i * 3);
        octx.stroke();
      });

      // Kahve fincanı gövdesi
      octx.fillStyle = "#f59e0b";
      octx.beginPath();
      octx.arc(offW / 2, 85, 42, 0, Math.PI, false);
      octx.fill();
      octx.fillRect(offW / 2 - 42, 72, 84, 16);

      // Fincan kulpu
      octx.strokeStyle = "#fbbf24";
      octx.lineWidth = 7;
      octx.beginPath();
      octx.arc(offW / 2 + 44, 92, 13, -Math.PI / 2, Math.PI / 2, false);
      octx.stroke();

      // Fincan tabağı
      octx.fillStyle = "#d97706";
      octx.fillRect(offW / 2 - 52, 133, 104, 8);

      // "BarOS" yazısı
      octx.font = "900 58px system-ui, -apple-system, sans-serif";
      octx.textAlign = "center";
      octx.fillStyle = "#fbbf24";
      octx.fillText("BarOS", offW / 2, 206);

      // Alt başlık
      octx.font = "700 13px monospace";
      octx.fillStyle = "#a1a1aa";
      octx.fillText("SMART CAFE & BAR SYSTEM", offW / 2, 232);

      const imgData = octx.getImageData(0, 0, offW, offH).data;
      const step = 3;
      const offsetX = width / 2 - offW / 2;
      const offsetY = height / 2 - offH / 2 - 15;

      for (let y = 0; y < offH; y += step) {
        for (let x = 0; x < offW; x += step) {
          const i = (y * offW + x) * 4;
          const a = imgData[i + 3];
          if (a > 90) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            targets.push({
              x: offsetX + x,
              y: offsetY + y,
              color: `rgb(${r},${g},${b})`,
            });
          }
        }
      }
    }

    const particles: SplashParticle[] = targets.map((t) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(width, height) * (0.35 + Math.random() * 0.55);
      return {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        tx: t.x,
        ty: t.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1.5,
        size: 1.7 + Math.random() * 1.4,
        color: t.color,
        alpha: 0.2 + Math.random() * 0.8,
        delay: Math.random() * 220,
      };
    });

    // Arka plan yüzen altın toz parçacıkları
    const ambientCount = 70;
    const ambient = Array.from({ length: ambientCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2,
      vy: -0.3 - Math.random() * 0.6,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    const startTime = performance.now();
    const assembleDuration = 1150;
    const holdDuration = 650;
    const disperseDuration = 450;
    const totalDuration = assembleDuration + holdDuration + disperseDuration;

    let rafId = 0;
    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      // Merkez altın hale (glow)
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        280
      );
      grad.addColorStop(0, "rgba(245, 158, 11, 0.14)");
      grad.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient altın kıvılcımlar
      ctx.fillStyle = "#fbbf24";
      for (const a of ambient) {
        a.y += a.vy;
        if (a.y < 0) a.y = height;
        ctx.globalAlpha = a.alpha;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ana logo parçacıkları
      for (const p of particles) {
        const localTime = Math.max(0, elapsed - p.delay);
        if (elapsed < assembleDuration + holdDuration) {
          const prog = Math.min(1, localTime / assembleDuration);
          const e = easeOutCubic(prog);
          const curX = p.x + (p.tx - p.x) * e + Math.sin(now * 0.005 + p.tx) * (1 - e) * 6;
          const curY = p.y + (p.ty - p.y) * e + Math.cos(now * 0.005 + p.ty) * (1 - e) * 6;
          ctx.globalAlpha = Math.min(1, 0.2 + prog * 0.85);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Dağılma (disperse) evresi
          const dProg = Math.min(
            1,
            (elapsed - (assembleDuration + holdDuration)) / disperseDuration
          );
          const curX = p.tx + p.vx * dProg * 35;
          const curY = p.ty + p.vy * dProg * 35;
          ctx.globalAlpha = Math.max(0, 1 - dProg);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(curX, curY, p.size * (1 + dProg * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (elapsed >= assembleDuration + holdDuration && !fadingOut) {
        setFadingOut(true);
      }

      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(render);
      } else {
        setVisible(false);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [visible, fadingOut]);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-end bg-zinc-950 pb-12 transition-opacity duration-500 ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="h-1 w-36 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-full origin-left animate-pulse bg-amber-500" />
        </div>
        <span className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
          Učitavanje sistema...
        </span>
      </div>
    </div>
  );
}
