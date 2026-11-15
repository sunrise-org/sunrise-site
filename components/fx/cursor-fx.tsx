"use client";

import { useEffect, useRef, useState } from "react";
import { Ferris } from "@/components/fx/ferris";

// Site-wide effects on top of the page, all off under reduced motion:
// - clicks throw a few pixels; now and then they are block bits (grass, dirt, stone) or rising XP-like sparks;
// - every so often a small crab walks along the bottom of the window.
export function CursorFx() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [crab, setCrab] = useState<{ id: number; flip: boolean } | null>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    type Bit = { x: number; y: number; vx: number; vy: number; s: number; c: string; life: number; float: boolean };
    const bits: Bit[] = [];
    let raf = 0;
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const BLOCKS = [["#5fae45", "#7ccf5a", "#7d5536"], ["#7d5536", "#9a6b45", "#664429"], ["#868a92", "#a3a7ae", "#6d7178"]];
    const burst = (x: number, y: number) => {
      const roll = Math.random();
      if (roll < 0.12) {
        for (let i = 0; i < 7; i++) bits.push({ x, y, vx: (Math.random() - 0.5) * 1.2, vy: -1 - Math.random() * 1.4, s: 4, c: i % 2 ? "#c8ff5a" : "#7dff6a", life: 1, float: true });
      } else {
        const pal = roll < 0.3 ? BLOCKS[Math.floor(Math.random() * BLOCKS.length)] : ["#ffc49a", "#ff8a5c", "#ffffff"];
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 2.5;
          bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, s: 3 + Math.random() * 3, c: pal[i % pal.length], life: 1, float: false });
        }
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.x += b.vx; b.y += b.vy;
        if (b.float) { b.vy *= 0.98; b.x += Math.sin(b.life * 20) * 0.3; } else b.vy += 0.18;
        b.life -= b.float ? 0.012 : 0.025;
        if (b.life <= 0) { bits.splice(i, 1); continue; }
        g.globalAlpha = Math.min(1, b.life * 1.5);
        g.fillStyle = b.c; g.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s);
      }
      g.globalAlpha = 1;
      raf = bits.length ? requestAnimationFrame(loop) : 0;
    };
    const onDown = (e: PointerEvent) => { if (e.button === 0) burst(e.clientX, e.clientY); };
    size();
    addEventListener("resize", size);
    addEventListener("pointerdown", onDown, { passive: true });

    // The crab: first visit after a short while, then rarely.
    let n = 0;
    const walk = () => setCrab({ id: ++n, flip: Math.random() < 0.5 });
    const first = setTimeout(walk, 9000);
    const again = setInterval(() => { if (!document.hidden && Math.random() < 0.35) walk(); }, 45000);
    return () => { removeEventListener("resize", size); removeEventListener("pointerdown", onDown); cancelAnimationFrame(raf); clearTimeout(first); clearInterval(again); };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
      {crab && (
        <div key={crab.id} aria-hidden className={`crab-walk ${crab.flip ? "crab-walk-back" : ""}`} onAnimationEnd={() => setCrab(null)}>
          <Ferris className="ferris-walk h-8 w-auto" />
        </div>
      )}
    </>
  );
}
