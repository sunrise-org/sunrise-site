"use client";

import { useEffect } from "react";

// One listener for the whole site. It tells the card under the pointer where the pointer is (--mx, --my, for the
// .glass-panel hover light) and the page where the pointer is (--cx, --cy on <html>, for the light and the brighter grid
// that follow it in .backdrop). Touch and pens are left alone.
export function PointerGlow() {
  useEffect(() => {
    let frame = 0;
    let x = 0;
    let y = 0;
    const root = document.documentElement;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          root.style.setProperty("--cx", `${x}px`);
          root.style.setProperty("--cy", `${y}px`);
          root.dataset.pointer = "";
        });
      }
      const card = (event.target as Element | null)?.closest?.<HTMLElement>(".glass-panel.soft-press");
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - box.left}px`);
      card.style.setProperty("--my", `${event.clientY - box.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
