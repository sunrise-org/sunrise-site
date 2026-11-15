// Sunrise Gaps' overview: where the project stands outside the mod API table. Each line restates what the FAQ and the
// home page already say; keep them in step when one changes (messages/en.json "faq", components/parity.tsx).
export type ProjectState = "Shipped" | "In progress" | "Planned";

export type ProjectRow = { area: string; state: ProjectState; detail: string; href?: string; link?: string };

export const PROJECT: ProjectRow[] = [
  { area: "The launcher", state: "Shipped", detail: "Windows on x64 or ARM, macOS on Apple Silicon or Intel, and Linux.", href: "/releases", link: "Releases" },
  { area: "Content mods and native Rust mods", state: "Shipped", detail: "They work today, installed from the launcher.", href: "/mods", link: "Mods" },
  { area: "Built-in profiler", state: "Shipped", detail: "Performance captures open in the browser and can be shared.", href: "/perf", link: "Profiler" },
  { area: "Vanilla parity on 26.3", state: "In progress", detail: "281 differential harnesses at the start. Players still find differences; parity work continues, redstone first." },
  { area: "Native mod API", state: "In progress", detail: "{covered} of {total} capabilities covered, {partial} partial; the table below lists every one.", href: "#claimable", link: "The table" },
  { area: "Java mods: Forge", state: "In progress", detail: "A compatibility layer; not finished, and not every mod loads yet." },
  { area: "More than one game version", state: "In progress", detail: "Play other versions than 26.3 from the same launcher." },
  { area: "Java mods: Fabric", state: "Planned", detail: "Comes after Forge." },
];
