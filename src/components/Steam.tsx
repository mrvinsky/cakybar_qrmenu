"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; seed: number };

/**
 * Canvas tabanlı buhar efekti. Parçacıklar alt-ortadaki "kaynak" bölgesinden doğar,
 * yükselirken sinüs dalgasıyla kıvrılır, büyür ve söner.
 * active=false olduğunda (örn. soğuk kokteyl) yeni buhar doğmaz, mevcut buhar doğalca yükselip kaybolur.
 */
export function Steam({
  className = "",
  emitterY = 0.62,
  emitterWidth = 0.22,
  density = 3,
  active = true,
}: {
  className?: string;
  emitterY?: number;
  emitterWidth?: number;
  density?: number;
  active?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef({ emitterY, emitterWidth, density, active });
  cfgRef.current = { emitterY, emitterWidth, density, active };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ps: P[] = [];

    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sg = sprite.getContext("2d")!;
    const g = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,248,235,0.55)");
    g.addColorStop(0.4, "rgba(255,240,220,0.18)");
    g.addColorStop(1, "rgba(255,240,220,0)");
    sg.fillStyle = g;
    sg.fillRect(0, 0, 64, 64);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = () => {
      const { emitterY: ey, emitterWidth: ew } = cfgRef.current;
      const max = 140 + Math.random() * 120;
      ps.push({
        x: w / 2 + (Math.random() - 0.5) * w * ew,
        y: h * ey + Math.random() * 8,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.45 + Math.random() * 0.55) * (h / 600),
        r: (3 + Math.random() * 6) * (w / 600),
        life: 0,
        max,
        seed: Math.random() * 1000,
      });
    };

    const tick = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      const { density: dens, active: isAct } = cfgRef.current;
      if (isAct) {
        for (let i = 0; i < Math.floor(dens); i++) spawn();
        if (Math.random() < dens % 1) spawn();
      }
      ctx.globalCompositeOperation = "lighter";

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        const k = p.life / p.max;
        if (k >= 1) { ps.splice(i, 1); continue; }
        const sway =
          Math.sin(t * 0.012 + p.y * 0.012) * (0.15 + k * 0.45) +
          Math.sin(p.seed + t * 0.03) * 0.1;
        p.x += p.vx + sway * 0.3;
        p.y += p.vy;
        p.vy *= 0.997;
        const size = p.r * (1 + k * 2.6);
        const a = Math.sin(Math.PI * k) * 0.42 * (1 - k * 0.5);
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, p.x - size, p.y - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    if (reduce) {
      for (let i = 0; i < 200; i++) spawn();
      ps.forEach((p) => { p.life = Math.random() * p.max * 0.8; p.y += p.vy * p.life; });
      tick();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
