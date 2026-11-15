"use client";

import { useEffect, useRef } from "react";
import { startWindowScene } from "@/components/fx/window-art";

// The home hero's background: the window at sunset (components/fx/window-art.ts), sized to its section.
export function WindowScene({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => (ref.current ? startWindowScene(ref.current) : undefined), []);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none [image-rendering:pixelated] ${className ?? ""}`} />;
}
