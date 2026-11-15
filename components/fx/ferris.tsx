import type { SVGProps } from "react";

// A small pixel crab, drawn for this site in the spirit of Ferris, the Rust mascot (public domain).
const BODY = "M4 5h8v1H4zM3 6h10v3H3zM2 7h1v2H2zM13 7h1v2h-1zM4 9h8v1H4z";
const CLAWS = "M0 3h2v1H0zM0 4h1v1H0zM14 3h2v1h-2zM15 4h1v1h-1zM1 5h1v2H1zM14 5h1v2h-1z";
const LEGS = "M3 10h1v1H3zM5 10h1v1H5zM10 10h1v1h-1zM12 10h1v1h-1z";
const EYES = "M6 3h1v2H6zM9 3h1v2H9z";

export function Ferris(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 12" shapeRendering="crispEdges" aria-hidden {...props}>
      <path fill="#f74c00" d={BODY} />
      <path fill="#f74c00" d={CLAWS} className="ferris-claws" />
      <path fill="#c43d00" d={LEGS} className="ferris-legs" />
      <path fill="#1b1b1b" d={EYES} />
      <path fill="#ffffff" d="M6 3h1v1H6zM9 3h1v1H9z" />
    </svg>
  );
}
