"use client";

import { useEffect, useState } from "react";
import { Ferris } from "@/components/fx/ferris";

// The About section's picture: a differential harness at work. Each row feeds one subsystem the same input in vanilla
// and in Sunrise and compares what comes out; a scan line walks down the rows. It is an illustration, not live data.
const ROWS = ["worldgen::noise", "worldgen::carvers", "chunk::palette", "light::sky", "net::protocol", "entity::physics", "block::ticking", "save::region"];

function hash(seed: number) {
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    out += (x & 15).toString(16);
  }
  return out;
}

export function HarnessPanel({ caption }: { caption: string }) {
  const [round, setRound] = useState(1);
  const [scan, setScan] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setScan((s) => {
        if (s + 1 >= ROWS.length) setRound((r) => r + 1);
        return (s + 1) % ROWS.length;
      });
    }, 650);
    return () => clearInterval(timer);
  }, []);

  return (
    <figure className="term relative flex flex-col overflow-hidden" aria-label={caption}>
      <div className="flex items-center gap-2 border-b border-[#33263a] px-4 py-3 font-mono text-xs text-dim">
        <span className="text-[#4cb782]">$</span> cargo test --test differential
        <span className="ml-auto">run {round}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 pt-3 pb-1 font-mono text-[10.5px] tracking-wider text-dim uppercase">
        <span>subsystem</span>
        <span>vanilla · sunrise</span>
        <span />
      </div>
      <ul className="flex-1 font-mono text-[12px]">
        {ROWS.map((row, i) => {
          const h = hash(i * 97 + round * 13);
          return (
            <li
              key={row}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-[7px] transition-colors duration-300 ${i === scan ? "bg-neon/10" : ""}`}
            >
              <span className="text-[#f0ddd4]">{row}</span>
              <span className="text-dim">
                {h.slice(0, 6)} <span className="text-[#5a4656]">=</span> {h.slice(0, 6)}
              </span>
              <span className={i <= scan ? "text-[#4cb782]" : "text-[#5a4656]"}>✓</span>
            </li>
          );
        })}
      </ul>
      <figcaption className="flex items-end justify-between border-t border-[#33263a] px-4 py-3 font-mono text-[11px] text-dim">
        <span>{caption}</span>
        <Ferris className="ferris-wave h-7 w-auto" />
      </figcaption>
    </figure>
  );
}
