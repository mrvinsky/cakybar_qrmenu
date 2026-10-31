"use client";

import { useEffect, useState } from "react";
import { ParticleImage, type DishSpec } from "./ParticleImage";
import { Steam } from "./Steam";

const DISHES: DishSpec[] = [
  { src: "/hero-dish.jpg", label: "Kafa", offsetY: -0.17, steam: true, emitterY: 0.36, emitterWidth: 0.2 },
  { src: "/hero-burger.jpg", label: "Burger", offsetY: -0.14, steam: true, emitterY: 0.33, emitterWidth: 0.24 },
  { src: "/hero-pasta.jpg", label: "Pasta", offsetY: -0.15, steam: true, emitterY: 0.35, emitterWidth: 0.24 },
  { src: "/hero-cocktail.jpg", label: "Koktel", offsetY: -0.15, steam: false, emitterY: 0.36, emitterWidth: 0.18 },
];

export function HeroDishShowcase() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIdx((p) => (p + 1) % DISHES.length);
    }, 4500);
    return () => clearInterval(id);
  }, [paused]);

  const current = DISHES[idx];

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md md:order-last md:max-w-xl md:scale-110 order-first"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <ParticleImage items={DISHES} activeIndex={idx} className="absolute inset-0 h-full w-full" />
      <Steam
        className="absolute inset-0 h-full w-full"
        emitterY={current.emitterY ?? 0.36}
        emitterWidth={current.emitterWidth ?? 0.2}
        density={1.6}
        active={current.steam !== false}
      />

      {/* Seçici hap butonlar */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-950/80 p-1 backdrop-blur">
        {DISHES.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              i === idx
                ? "bg-amber-500 text-zinc-950 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
