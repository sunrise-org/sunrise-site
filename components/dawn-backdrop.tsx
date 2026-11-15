// The light behind every page: CSS only (app/globals.css, "Golden hour"), so it costs no script and stills under
// reduced motion. The warm light follows the pointer through --cx/--cy (components/pointer-glow.tsx).
export function DawnBackdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop-aura" />
      <div className="backdrop-spot" />
    </div>
  );
}
