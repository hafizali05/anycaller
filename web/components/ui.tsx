"use client";

/* any/call — shared UI primitives. Ported from designs/app-components.jsx. */

import React, { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

/* ────────────────────────────────────────────────────────────────────
 * Wordmark — any/call with a live record dot
 * ──────────────────────────────────────────────────────────────────── */
export function Wordmark({
  size = 18,
  live = false,
  color,
}: {
  size?: number;
  live?: boolean;
  color?: string;
}) {
  const c = color || "var(--ink)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.02em",
        color: c,
      }}
    >
      <span style={{ position: "relative", display: "inline-block", width: size * 0.5, height: size * 0.5 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: live ? "var(--accent)" : "var(--ink)",
            animation: live ? "ac-blink 1.4s ease-in-out infinite" : "none",
          }}
        />
        {live && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "ac-pulse-ring 1.4s ease-out infinite",
            }}
          />
        )}
      </span>
      <span>
        any<span style={{ color: "var(--ink-3)", fontWeight: 400, margin: "0 0.05em" }}>/</span>call
      </span>
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Waveform — animated audio bars
 * ──────────────────────────────────────────────────────────────────── */
type WaveState = "idle" | "listening" | "speaking" | "paused";

export function Waveform({
  bars = 28,
  height = 36,
  state = "speaking",
  color,
  gap = 3,
  barWidth = 3,
  fill = false,
}: {
  bars?: number;
  height?: number;
  state?: WaveState;
  color?: string;
  gap?: number;
  barWidth?: number;
  fill?: boolean;
}) {
  const seed = useMemo(() => {
    // Deterministic LCG seeded by `bars` so SSR and client render the same.
    let s = bars * 9301 + 49297;
    const r = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const arr: { base: number; amp: number; dur: number; delay: number }[] = [];
    for (let i = 0; i < bars; i++) {
      const t = (i / (bars - 1)) * 2 - 1;
      const envelope = 0.35 + 0.65 * Math.exp(-t * t * 1.6);
      arr.push({
        base: 0.18 + r() * 0.5,
        amp: envelope,
        dur: 0.5 + r() * 0.8,
        delay: -r() * 1.2,
      });
    }
    return arr;
  }, [bars]);

  const animate = state === "speaking" || state === "listening";
  const c = color || (state === "speaking" ? "var(--accent)" : "var(--ink-2)");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${gap}px`,
        height,
        width: fill ? "100%" : "auto",
        justifyContent: fill ? "space-between" : "flex-start",
      }}
    >
      {seed.map((s, i) => (
        <div
          key={i}
          style={{
            width: fill ? `${barWidth}px` : barWidth,
            flex: fill ? `0 0 ${barWidth}px` : "none",
            height: `${Math.max(8, height * s.amp * s.base)}px`,
            background: c,
            borderRadius: barWidth,
            transformOrigin: "center",
            animation: animate ? `ac-wave ${s.dur}s ease-in-out ${s.delay}s infinite` : "none",
            opacity: state === "idle" ? 0.35 : 1,
          }}
        />
      ))}
    </div>
  );
}

/* Static waveform for completed recordings */
export function StaticWaveform({
  width = 240,
  height = 28,
  color,
  seed = 7,
  progress = 1,
  bars,
}: {
  width?: number;
  height?: number;
  color?: string;
  seed?: number;
  progress?: number;
  bars?: number;
}) {
  const c = color || "var(--ink-2)";
  const n = bars || Math.floor(width / 4);
  const cells = useMemo(() => {
    let s = seed;
    const r = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1;
      const env = 0.4 + 0.6 * Math.exp(-t * t * 1.2);
      out.push(0.2 + r() * 0.8 * env);
    }
    return out;
  }, [n, seed]);
  const w = width / n;
  const playedTo = Math.floor(n * progress);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {cells.map((v, i) => {
        const h = Math.max(2, v * height);
        const x = i * w + w / 2;
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={(height - h) / 2}
            y2={(height + h) / 2}
            stroke={i <= playedTo ? c : "var(--ink-4)"}
            strokeWidth={Math.max(1.5, w * 0.55)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Status pill
 * ──────────────────────────────────────────────────────────────────── */
type StatusKey = "queued" | "ringing" | "live" | "completed" | "voicemail" | "failed" | "optout";

export const STATUS: Record<StatusKey, { dot: string; label: string; bg: string; blink?: boolean }> = {
  queued: { dot: "var(--ink-3)", label: "Queued", bg: "transparent" },
  ringing: { dot: "var(--amber)", label: "Ringing", bg: "var(--amber-soft)" },
  live: { dot: "var(--accent)", label: "Live", bg: "var(--accent-soft)", blink: true },
  completed: { dot: "var(--sage)", label: "Completed", bg: "var(--sage-soft)" },
  voicemail: { dot: "var(--amber)", label: "Voicemail", bg: "var(--amber-soft)" },
  failed: { dot: "var(--ink-3)", label: "No answer", bg: "transparent" },
  optout: { dot: "var(--ink-2)", label: "Opt-out", bg: "transparent" },
};

export function StatusPill({ status, size = "sm" }: { status: StatusKey; size?: "sm" | "md" }) {
  const s = STATUS[status] || STATUS.queued;
  const pad = size === "sm" ? "3px 8px 3px 6px" : "5px 10px 5px 8px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 999,
        background: s.bg,
        fontFamily: "var(--font-mono)",
        fontSize: fs,
        fontWeight: 500,
        color: s.bg === "transparent" ? "var(--ink-2)" : "var(--ink)",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          animation: s.blink ? "ac-blink 1.4s ease-in-out infinite" : "none",
        }}
      />
      {s.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Buttons
 * ──────────────────────────────────────────────────────────────────── */
export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  icon,
  style,
  full,
}: {
  variant?: "primary" | "accent" | "ghost" | "quiet" | "soft";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
  full?: boolean;
}) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    transition: "background .15s, transform .08s, box-shadow .15s, color .15s",
    whiteSpace: "nowrap",
    userSelect: "none",
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : "auto",
  };
  const sizes: Record<string, CSSProperties> = {
    sm: { padding: "6px 11px", fontSize: 12, borderRadius: 7, height: 28 },
    md: { padding: "8px 14px", fontSize: 13, borderRadius: 8, height: 34 },
    lg: { padding: "12px 20px", fontSize: 15, borderRadius: 10, height: 44 },
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: "var(--ink)", color: "var(--paper)" },
    accent: { background: "var(--accent)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--ink)", boxShadow: "inset 0 0 0 1px var(--border-2)" },
    quiet: { background: "transparent", color: "var(--ink-2)" },
    soft: { background: "var(--paper-2)", color: "var(--ink)" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Icon — minimal hairline glyphs
 * ──────────────────────────────────────────────────────────────────── */
export function Icon({
  name,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.5,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "phone":
      return (
        <svg {...p}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case "brief":
      return (
        <svg {...p}>
          <path d="M4 4h12l4 4v12H4z" />
          <path d="M16 4v4h4" />
          <path d="M7 10h6M7 13h10M7 16h8" />
        </svg>
      );
    case "list":
      return (
        <svg {...p}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="4" cy="12" r="1" />
          <circle cx="4" cy="18" r="1" />
        </svg>
      );
    case "dial":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "feed":
      return (
        <svg {...p}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case "play":
      return (
        <svg {...p}>
          <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pause":
      return (
        <svg {...p}>
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...p}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...p}>
          <path d="M12 3v6m0 6v6M3 12h6m6 0h6M5.5 5.5l4 4m5 5l4 4M18.5 5.5l-4 4m-5 5l-4 4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...p}>
          <path d="M12 3v13M5 10l7-7 7 7M3 21h18" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M4 12l5 5L20 6" />
        </svg>
      );
    case "x":
      return (
        <svg {...p}>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "menu":
      return (
        <svg {...p}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "gear":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "voicemail":
      return (
        <svg {...p}>
          <circle cx="6" cy="14" r="4" />
          <circle cx="18" cy="14" r="4" />
          <path d="M6 14h12" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "arrowU":
      return (
        <svg {...p}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case "arrowD":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    case "chev":
      return (
        <svg {...p}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "wave":
      return (
        <svg {...p}>
          <path d="M2 12h2l2-6 4 12 4-16 4 12 2-6h4" />
        </svg>
      );
    case "eye":
      return (
        <svg {...p}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "circle":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "square":
      return (
        <svg {...p}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

/* ────────────────────────────────────────────────────────────────────
 * Tag / chip
 * ──────────────────────────────────────────────────────────────────── */
export function Tag({
  children,
  tone = "neutral",
  mono = true,
}: {
  children?: ReactNode;
  tone?: "neutral" | "accent" | "sage" | "amber" | "slate" | "outline";
  mono?: boolean;
}) {
  const tones: Record<string, { bg: string; color: string; box?: string }> = {
    neutral: { bg: "var(--paper-2)", color: "var(--ink-2)" },
    accent: { bg: "var(--accent-soft)", color: "var(--accent-2)" },
    sage: { bg: "var(--sage-soft)", color: "var(--sage)" },
    amber: { bg: "var(--amber-soft)", color: "var(--amber)" },
    slate: { bg: "var(--slate-soft)", color: "var(--slate)" },
    outline: { bg: "transparent", color: "var(--ink-2)", box: "inset 0 0 0 1px var(--border-2)" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background: t.bg,
        color: t.color,
        boxShadow: t.box,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        fontSize: 11,
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Streaming text
 * ──────────────────────────────────────────────────────────────────── */
export function StreamText({
  text,
  speed = 14,
  delay = 0,
  caret = true,
  onDone,
  trigger = 0,
}: {
  text: string;
  speed?: number;
  delay?: number;
  caret?: boolean;
  onDone?: () => void;
  trigger?: number;
}) {
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(delay === 0);
  useEffect(() => {
    setN(0);
    setStarted(delay === 0);
  }, [text, trigger, delay]);
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay, text, trigger]);
  useEffect(() => {
    if (!started) return;
    if (n >= text.length) {
      onDone && onDone();
      return;
    }
    const t = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(t);
  }, [n, started, text, speed, onDone]);
  const done = n >= text.length;
  return (
    <span>
      {text.slice(0, n)}
      {caret && !done && started && (
        <span
          style={{
            display: "inline-block",
            width: "0.55em",
            height: "1em",
            background: "var(--accent)",
            verticalAlign: "-0.13em",
            marginLeft: 1,
            animation: "ac-caret 0.9s steps(1) infinite",
          }}
        />
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section heading
 * ──────────────────────────────────────────────────────────────────── */
export function SectionLabel({ children, hint }: { children?: ReactNode; hint?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 10,
      }}
    >
      <span>{children}</span>
      {hint && <span style={{ color: "var(--ink-4)", textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Landing-page helpers (also exported for reuse)
 * ──────────────────────────────────────────────────────────────────── */
export function HomeRule({ label, color }: { label?: ReactNode; color?: string }) {
  const c = color || "var(--border-2)";
  if (!label) return <div style={{ height: 1, background: c }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flex: 1, height: 1, background: c }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: c }} />
    </div>
  );
}

export function Eyebrow({
  children,
  color,
  dot,
}: {
  children?: ReactNode;
  color?: string;
  dot?: boolean | "live";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: color || "var(--ink-3)",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color || "var(--accent)",
            animation: dot === "live" ? "ac-blink 1.4s infinite" : "none",
          }}
        />
      )}
      {children}
    </span>
  );
}

export function Display({
  children,
  size = 88,
  color,
  max = 1000,
}: {
  children?: ReactNode;
  size?: number;
  color?: string;
  max?: number;
}) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.025em",
        color: color || "var(--ink)",
        maxWidth: max,
        textWrap: "pretty",
      }}
    >
      {children}
    </h1>
  );
}
