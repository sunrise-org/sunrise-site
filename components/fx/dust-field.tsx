"use client";

import { useEffect, useRef } from "react";

type Props = { className?: string; count?: number };

// A section's background: warm pixel dust drifting slowly, as in the light from the home page's window. Specks near
// the pointer glow a little brighter. It draws only while on screen; under reduced motion it draws once and stops.
export function DustField({ className, count = 70 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 3;
    let w = 0, h = 0, raf = 0, visible = false;
    const mouse = { x: -999, y: -999 };
    const specks = Array.from({ length: count }, (_, i) => ({ x: (i * 977) % 1000 / 1000, y: (i * 613) % 1000 / 1000, s: (i * 37) % 100 / 100 }));

    const size = () => {
      const box = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(box.width / SCALE));
      h = Math.max(1, Math.round(box.height / SCALE));
      canvas.width = w;
      canvas.height = h;
    };
    const draw = (ms: number) => {
      const t = still ? 0 : ms / 1000;
      g.clearRect(0, 0, w, h);
      for (const p of specks) {
        const x = (p.x * w + t * (1 + p.s * 2) + Math.sin(t * 0.5 + p.s * 9) * 3) % w;
        const y = (p.y * h - t * (0.6 + p.s) + h * 10) % h;
        const near = Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / 40);
        const a = 0.12 + 0.35 * Math.abs(Math.sin(t * 0.7 + p.s * 10)) + near * 0.5;
        g.fillStyle = p.s > 0.8 ? `rgba(255,190,140,${a})` : `rgba(255,224,190,${a})`;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    };
    const loop = (ms: number) => {
      draw(ms);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - box.left) / SCALE;
      mouse.y = (e.clientY - box.top) / SCALE;
    };
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !still) raf = requestAnimationFrame(loop);
    });
    const resize = new ResizeObserver(() => {
      size();
      draw(performance.now());
    });
    size();
    draw(0);
    seen.observe(canvas);
    resize.observe(canvas);
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      resize.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [count]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none [image-rendering:pixelated] ${className ?? ""}`} />;
}
