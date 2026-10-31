"use client";

import { useEffect, useRef } from "react";

export type DishSpec = {
  src: string;
  label: string;
  offsetY?: number;
  steam?: boolean;
  emitterY?: number;
  emitterWidth?: number;
};

type SamplePoint = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  nx: number; // normalize edilmiş koordinat (-1..1)
  ny: number;
};

type Dot = {
  // Başlangıç (morph öncesi) durumu
  sx: number;
  sy: number;
  sr: number;
  sg: number;
  sb: number;
  sa: number;
  // Hedef (morph sonrası) durumu
  tx: number;
  ty: number;
  tr: number;
  tg: number;
  tb: number;
  ta: number;
  // Kavis yönü ve gecikme (dalga etkisi için)
  delay: number; // 0..0.28
  arc: number;   // yörünge kavisi (px)
  // Anlık çizim konumu + fare etkileşimi ofseti
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  a: number;
  s: number;
  ph: number;
};

// İpeksi yumuşak geçiş eğrisi
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Görseller arasında gerçek parçacık dönüşümü (smooth morphing):
 * - Her görselin parçacıkları kendi merkezine göre uzamsal olarak sıralanır ve eşleştirilir.
 * - Geçiş başladığında her parçacık kendi başlangıç noktasından hedef noktasına
 *   yumuşak kavisli bir yörüngeyle (cubic ease-in-out) süzülerek akar ve rengi dönüşür.
 */
export function ParticleImage({
  items,
  activeIndex = 0,
  className = "",
  gap = 2,
  threshold = 38,
}: {
  items: DishSpec[];
  activeIndex?: number;
  className?: string;
  gap?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(activeIndex);
  const morphToRef = useRef<(idx: number, instant: boolean) => void>(() => {});

  useEffect(() => {
    if (activeRef.current !== activeIndex) {
      activeRef.current = activeIndex;
      morphToRef.current(activeIndex, false);
    }
  }, [activeIndex]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, frame = 0;
    let dots: Dot[] = [];
    let morphStart = performance.now();
    let morphDuration = 1850; // ms - dönüşüm süresi

    const samples: (SamplePoint[] | null)[] = items.map(() => null);
    const images: HTMLImageElement[] = items.map((it) => {
      const im = new Image();
      im.src = it.src;
      return im;
    });
    const mouse = { x: -9999, y: -9999 };

    const sampleImage = (idx: number): SamplePoint[] | null => {
      const img = images[idx];
      const spec = items[idx];
      if (!img || !img.complete || !img.naturalWidth || !w) return null;
      const off = document.createElement("canvas");
      off.width = Math.round(w);
      off.height = Math.round(h);
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, (spec.offsetY ?? -0.17) * h, w, h);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const g = Math.max(1.5, gap * (w / 500));
      const pts: SamplePoint[] = [];

      let sumX = 0, sumY = 0;
      for (let y = 0; y < off.height; y += g) {
        for (let x = 0; x < off.width; x += g) {
          const i = (Math.floor(y) * off.width + Math.floor(x)) * 4;
          const r = data[i], gr = data[i + 1], b = data[i + 2];
          const lum = 0.299 * r + 0.587 * gr + 0.114 * b;
          if (lum < threshold) continue;
          sumX += x;
          sumY += y;
          pts.push({ x, y, r, g: gr, b, nx: 0, ny: 0 });
        }
      }

      if (pts.length > 0) {
        const cx = sumX / pts.length;
        const cy = sumY / pts.length;
        for (const p of pts) {
          p.nx = (p.x - cx) / w;
          p.ny = (p.y - cy) / h;
        }
        // Uzamsal tutarlılık için yumuşak bant sıralaması (üstten alta, soldan sağa)
        // Böylece bir görselin üst/sol/sağ parçacıkları diğer görselin aynı bölgesine akar.
        const band = 0.025;
        pts.sort((a, b) => {
          const byA = Math.round(a.ny / band);
          const byB = Math.round(b.ny / band);
          if (byA !== byB) return byA - byB;
          return a.nx - b.nx;
        });
      }

      samples[idx] = pts;
      return pts;
    };

    const morphTo = (idx: number, instant: boolean) => {
      const pts = samples[idx] ?? sampleImage(idx);
      if (!pts || pts.length === 0) return;
      const g = Math.max(1.5, gap * (w / 500));
      const pSize = Math.max(1, Math.round(g * 1.15));
      const nTarget = pts.length;

      // İlk kurulum
      if (dots.length === 0) {
        dots = pts.map((p) => ({
          sx: p.x, sy: p.y, sr: p.r, sg: p.g, sb: p.b, sa: 1,
          tx: p.x, ty: p.y, tr: p.r, tg: p.g, tb: p.b, ta: 1,
          delay: 0,
          arc: 0,
          x: p.x, y: p.y,
          ox: 0, oy: 0, vx: 0, vy: 0,
          r: p.r, g: p.g, b: p.b, a: 1,
          s: pSize,
          ph: Math.random() * Math.PI * 2,
        }));
        morphStart = performance.now() - 5000;
        return;
      }

      // Parçacık havuzunu mevcut görünür noktalardan klonlayarak tamamla
      // (Böylece yeni parçacıklar dışarıdan düşmez, mevcut parçacıklar bölünerek çoğalır)
      const activeDots = dots.filter((d) => d.a > 0.05);
      const sourcePool = activeDots.length > 0 ? activeDots : dots;

      if (dots.length < nTarget) {
        const needed = nTarget - dots.length;
        for (let i = 0; i < needed; i++) {
          const src = sourcePool[Math.floor((i / needed) * sourcePool.length)];
          dots.push({
            ...src,
            ph: Math.random() * Math.PI * 2,
          });
        }
      }

      // Mevcut parçacıkları da o anki konumlarına göre (üstten alta, soldan sağa) sırala
      // ki her parçacık en yakın/mantıklı hedef noktaya aksın, kaos olmasın
      const bandPx = Math.max(6, h * 0.025);
      dots.sort((a, b) => {
        const byA = Math.round(a.y / bandPx);
        const byB = Math.round(b.y / bandPx);
        if (byA !== byB) return byA - byB;
        return a.x - b.x;
      });

      const cx = w / 2, cy = h / 2;
      const maxR = Math.hypot(w, h) * 0.45;
      const total = dots.length;

      for (let i = 0; i < total; i++) {
        const d = dots[i];
        // Başlangıç durumunu şu anki canlı konumu ve rengine sabitle
        d.sx = d.x;
        d.sy = d.y;
        d.sr = d.r;
        d.sg = d.g;
        d.sb = d.b;
        d.sa = d.a;
        d.s = pSize;

        if (i < nTarget) {
          // Orantılı indeks eşleşmesi
          const tp = pts[i];
          d.tx = tp.x;
          d.ty = tp.y;
          d.tr = tp.r;
          d.tg = tp.g;
          d.tb = tp.b;
          d.ta = 1;
        } else {
          // Fazla parçacıklar en yakın hedef noktaya doğru birleşerek yumuşakça erir
          const mappedIdx = Math.floor((i / total) * nTarget);
          const tp = pts[Math.min(nTarget - 1, mappedIdx)];
          d.tx = tp.x;
          d.ty = tp.y;
          d.tr = tp.r;
          d.tg = tp.g;
          d.tb = tp.b;
          d.ta = 0;
        }

        // Merkezden dışa doğru hafif dalga gecikmesi (0..0.24)
        const distFromCenter = Math.hypot(d.sx - cx, d.sy - cy);
        d.delay = Math.min(0.24, (distFromCenter / maxR) * 0.22);

        // Hareket mesafesine orantılı zarif kavis
        const moveDist = Math.hypot(d.tx - d.sx, d.ty - d.sy);
        const sign = (i % 2 === 0 ? 1 : -1);
        d.arc = Math.min(28, moveDist * 0.18) * sign;
      }

      morphDuration = instant || reduce ? 1 : 1850;
      morphStart = performance.now();
    };

    morphToRef.current = morphTo;

    const rebuildAll = () => {
      if (!w) return;
      for (let i = 0; i < items.length; i++) samples[i] = null;
      dots = [];
      morphTo(activeRef.current, true);
    };

    const resize = () => {
      const rc = canvas.getBoundingClientRect();
      w = rc.width; h = rc.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildAll();
    };

    const onMove = (e: PointerEvent) => {
      const rc = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rc.left;
      mouse.y = e.clientY - rc.top;
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };

    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d")!;
    let imgData: ImageData | null = null;
    let px: Uint32Array | null = null;

    const tick = (now: number) => {
      frame += 1;
      const bw = Math.max(1, Math.round(w)), bh = Math.max(1, Math.round(h));
      if (!imgData || imgData.width !== bw || imgData.height !== bh) {
        buf.width = bw; buf.height = bh;
        imgData = bctx.createImageData(bw, bh);
        px = new Uint32Array(imgData.data.buffer);
      }
      px!.fill(0);

      const elapsed = (now - morphStart) / morphDuration;
      const R = w * 0.11;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // Kişisel gecikmeli ilerleme (0..1)
        const rawP = (elapsed - d.delay) / (1 - d.delay);
        const p = rawP <= 0 ? 0 : rawP >= 1 ? 1 : easeInOutCubic(rawP);

        // Kavisli yörünge (parabolik yan sapma: p=0 ve p=1'de sıfır, p=0.5'te maksimum)
        const dxPath = d.tx - d.sx;
        const dyPath = d.ty - d.sy;
        const len = Math.hypot(dxPath, dyPath) || 1;
        const nx = -dyPath / len;
        const ny = dxPath / len;
        const curve = Math.sin(p * Math.PI) * d.arc;

        const baseX = d.sx + dxPath * p + nx * curve;
        const baseY = d.sy + dyPath * p + ny * curve;

        // Hafif canlı salınım
        const breatheX = Math.sin(frame * 0.03 + d.ph) * 0.45;
        const breatheY = Math.cos(frame * 0.025 + d.ph) * 0.45;

        // Fare etkileşimi ofseti
        const mdx = baseX + d.ox - mouse.x;
        const mdy = baseY + d.oy - mouse.y;
        const dist2 = mdx * mdx + mdy * mdy;
        if (dist2 < R * R) {
          const f = (1 - Math.sqrt(dist2) / R) * 2.2;
          const inv = 1 / (Math.sqrt(dist2) || 1);
          d.vx += mdx * inv * f;
          d.vy += mdy * inv * f;
        }
        d.vx += -d.ox * 0.12;
        d.vy += -d.oy * 0.12;
        d.vx *= 0.8;
        d.vy *= 0.8;
        d.ox += d.vx;
        d.oy += d.vy;

        d.x = baseX + breatheX + d.ox;
        d.y = baseY + breatheY + d.oy;

        // Renk ve görünürlük interpolasyonu
        d.r = d.sr + (d.tr - d.sr) * p;
        d.g = d.sg + (d.tg - d.sg) * p;
        d.b = d.sb + (d.tb - d.sb) * p;
        d.a = d.sa + (d.ta - d.sa) * p;

        if (d.a < 0.08) continue;

        const x0 = d.x | 0, y0 = d.y | 0;
        if (x0 < 0 || y0 < 0 || x0 >= bw || y0 >= bh) continue;

        const alpha = (d.a * 255) | 0;
        const col = (alpha << 24) | ((d.b | 0) << 16) | ((d.g | 0) << 8) | (d.r | 0);
        const x1 = Math.min(bw, x0 + d.s), y1 = Math.min(bh, y0 + d.s);
        for (let yy = y0; yy < y1; yy++) {
          const row = yy * bw;
          for (let xx = x0; xx < x1; xx++) px![row + xx] = col;
        }
      }

      // Geçiş bittiğinde eriyen fazla parçacıkları temizle
      if (elapsed > 1.05 && dots.length > 0 && dots[dots.length - 1].ta === 0) {
        dots = dots.filter((d) => d.ta > 0);
      }

      bctx.putImageData(imgData, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(buf, 0, 0, w, h);
      raf = requestAnimationFrame(tick);
    };

    images.forEach((im, idx) => {
      im.onload = () => {
        sampleImage(idx);
        if (idx === activeRef.current && dots.length === 0) {
          morphTo(idx, true);
          if (reduce) { tick(performance.now()); cancelAnimationFrame(raf); }
        }
      };
    });

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [items, gap, threshold]);

  return <canvas ref={ref} role="img" aria-label="Prikaz hrane od čestica" className={className} />;
}
