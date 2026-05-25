/* Tiny build-version stamp pinned to the top-left of every page.
 * The timestamp is baked at build time (see next.config.ts) so it
 * stays stable per release and reveals when the running bundle was
 * compiled. */

const ISO = process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString();

function format(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${hh}:${mm}:${ss} UTC · ${months[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

export function VersionStamp() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 4,
        left: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 8.5,
        lineHeight: 1,
        letterSpacing: "0.02em",
        color: "var(--ink-4)",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 9999,
        opacity: 0.7,
      }}
    >
      {format(ISO)}
    </div>
  );
}
