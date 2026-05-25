"use client";

/* any/call — landing page. Ported from designs/app-screens-home.jsx. */

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Button,
  Display,
  Eyebrow,
  Icon,
  StaticWaveform,
  StatusPill,
  Tag,
  Waveform,
  Wordmark,
} from "@/components/ui";

/* ────────────────────────────────────────────────────────────────────
 * Nav
 * ──────────────────────────────────────────────────────────────────── */
function HomeNav() {
  const link: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    color: "var(--ink-2)",
    textDecoration: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  };
  return (
    <nav
      style={{
        height: 72,
        padding: "0 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--paper)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Wordmark size={20} live />
        <div style={{ display: "flex", gap: 4 }}>
          <a href="#how-it-works" style={link}>How it works</a>
          <a href="#use-cases" style={link}>Use cases</a>
          <a href="#trust" style={link}>Trust</a>
          <a href="#pricing" style={link}>Pricing</a>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/login" style={{ ...link, color: "var(--ink-2)", textDecoration: "none" }}>
          Sign in
        </Link>
        <Link href="/signup" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="md" icon={<Icon name="phone" size={13} color="var(--paper)" />}>
            Start free · 10 min
          </Button>
        </Link>
      </div>
    </nav>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Hero
 * ──────────────────────────────────────────────────────────────────── */
function HomeHero() {
  return (
    <section
      style={{
        padding: "64px 56px 88px",
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        gap: 56,
        alignItems: "center",
        background: "var(--paper)",
        position: "relative",
      }}
    >
      <div
        data-mobile-hide
        style={{
          position: "absolute",
          top: 28,
          right: 56,
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
          textAlign: "right",
        }}
      >
        v1.0 · public beta
        <br />
        powered by VAPI &amp; ElevenLabs
      </div>

      <div>
        <Eyebrow color="var(--accent)" dot="live">
          An AI dialer for the rest of us
        </Eyebrow>

        <div style={{ marginTop: 22 }}>
          <Display size={92} max={760}>
            What should we
            <br />
            <span style={{ color: "var(--accent)" }}>call</span> about?
          </Display>
        </div>

        <p
          style={{
            marginTop: 26,
            maxWidth: 540,
            fontSize: 18,
            lineHeight: 1.5,
            color: "var(--ink-2)",
            textWrap: "pretty",
          }}
        >
          Describe the conversation in plain language. We build the agent, dial the numbers you upload,
          and hand back transcripts, recordings, and the data you asked for — structured.
        </p>

        <div
          style={{
            marginTop: 32,
            background: "var(--paper-2)",
            borderRadius: 14,
            padding: "20px 22px",
            boxShadow: "inset 0 0 0 1px var(--border)",
            maxWidth: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Eyebrow>Your brief</Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>
              ↵ to generate
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 1.5,
              color: "var(--ink)",
            }}
          >
            &ldquo;I&rsquo;m selling accounting software to small businesses. Ask if they use anything today,
            what it is, and what they like or dislike about it…
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 18,
                background: "var(--accent)",
                verticalAlign: "-3px",
                marginLeft: 2,
                animation: "ac-caret 0.9s steps(1) infinite",
              }}
            />
            &rdquo;
          </p>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Tag tone="outline">CSV of numbers</Tag>
              <Tag tone="outline">Pick a voice</Tag>
              <Tag tone="outline">Window 9–6</Tag>
            </div>
            <Button variant="accent" size="md" icon={<Icon name="phone" size={13} color="#fff" />}>
              Call them
            </Button>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12.5,
            color: "var(--ink-3)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={12} color="var(--sage)" /> No credit card
          </span>
          <span>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={12} color="var(--sage)" /> 10 minutes on the house
          </span>
          <span>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={12} color="var(--sage)" /> First call in &lt; 5 minutes
          </span>
        </div>
      </div>

      <HeroLiveCard />
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Hero — live call card (interactive timer)
 * ──────────────────────────────────────────────────────────────────── */
function HeroLiveCard() {
  const [elapsed, setElapsed] = useState(47);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 18,
          transform: "rotate(-1.5deg)",
          background: "var(--paper-2)",
          borderRadius: 18,
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: "var(--paper-2)",
          borderRadius: 18,
          boxShadow: "0 22px 60px -28px rgba(26,23,20,0.25), inset 0 0 0 1px var(--border)",
          padding: 22,
          transform: "rotate(0.6deg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <Eyebrow color="var(--accent)" dot="live">
              Live · in progress
            </Eyebrow>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>
              Jin Park <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· Park Family Dental</span>
            </div>
            <div style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
              +1 (917) 555-0119 · ET · attempt 1 of 3
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                color: "var(--accent)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {fmt(elapsed)}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-3)",
                marginTop: 4,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              elapsed
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            background: "var(--paper)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow color="var(--accent)" dot>
              Ava speaking
            </Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>turn 7</span>
          </div>
          <Waveform bars={48} height={42} state="speaking" gap={2.5} barWidth={3} fill color="var(--accent)" />
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <HeroTurn who="ava" t="00:39" text="Six years is a long relationship. What works well, and what bugs you?" />
          <HeroTurn
            who="them"
            t="00:47"
            text="We mostly like it — but the payroll add-on got expensive after the last price"
            live
          />
        </div>

        <div
          style={{
            marginTop: 16,
            background: "var(--paper)",
            borderRadius: 10,
            padding: "12px 14px",
            boxShadow: "inset 0 0 0 1px var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <MiniField k="contact_role" v="bookkeeper" pct={88} />
          <MiniField k="software" v="QuickBooks Online" pct={97} />
          <MiniField k="dislikes" v="listening…" pulsing />
        </div>
      </div>
    </div>
  );
}

function HeroTurn({ who, t, text, live }: { who: "ava" | "them"; t: string; text: string; live?: boolean }) {
  const isAva = who === "ava";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 10, alignItems: "baseline" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{t}</div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: isAva ? "var(--accent)" : "var(--ink-3)",
          }}
        >
          {isAva ? "Ava" : "Jin"}
        </div>
        <div
          style={{
            fontFamily: isAva ? "var(--font-display)" : "var(--font-ui)",
            fontStyle: isAva ? "italic" : "normal",
            fontSize: isAva ? 14.5 : 13.5,
            color: "var(--ink)",
            lineHeight: 1.45,
            marginTop: 1,
          }}
        >
          {text}
          {live && (
            <span
              style={{
                display: "inline-block",
                width: 5,
                height: 12,
                background: "var(--ink-4)",
                verticalAlign: "-2px",
                marginLeft: 2,
                animation: "ac-caret 0.9s steps(1) infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MiniField({ k, v, pct, pulsing }: { k: string; v: string; pct?: number; pulsing?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {k}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
        <span style={{ fontSize: 12.5, color: "var(--ink)", fontStyle: pulsing ? "italic" : "normal" }}>{v}</span>
        {pct != null && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sage)" }}>{pct}%</span>
        )}
        {pulsing && (
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "ac-blink 1.4s infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Transformation — "You write the brief. We draft the agent."
 * ──────────────────────────────────────────────────────────────────── */
function TransformationSection() {
  return (
    <section
      style={{
        padding: "88px 56px",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
        <div>
          <Eyebrow>01 · The magic moment</Eyebrow>
          <Display size={56} max={780}>
            You write a brief.
            <br />
            We draft the agent — opening line, objectives, fallbacks,
            <span style={{ color: "var(--accent)" }}> the data to extract</span>.
          </Display>
        </div>
        <div
          style={{
            maxWidth: 280,
            fontSize: 13.5,
            color: "var(--ink-2)",
            lineHeight: 1.5,
            paddingBottom: 8,
          }}
        >
          Every field is editable before you launch. 40% of accounts ship the first draft as-is.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 50px 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background: "var(--paper)",
            borderRadius: 14,
            padding: "28px 30px",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Eyebrow>Brief · what you type</Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>92 words</span>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 18.5,
              lineHeight: 1.55,
              color: "var(--ink)",
            }}
          >
            &ldquo;I&rsquo;m selling accounting software to small businesses in the US. Please call the business,
            confirm you&rsquo;re speaking with someone who handles their books, and ask:{" "}
            <span style={{ background: "var(--accent-soft)", padding: "0 3px" }}>
              whether they use any accounting software
            </span>
            , <span style={{ background: "var(--accent-soft)", padding: "0 3px" }}>which one</span>,{" "}
            <span style={{ background: "var(--accent-soft)", padding: "0 3px" }}>what they like and dislike</span>,
            and whether they&rsquo;d be open to a 15-minute demo next week. Be friendly and don&rsquo;t push if
            they say no.&rdquo;
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "var(--paper)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 0 0 1px var(--border-2)",
            }}
          >
            <Icon name="arrow" size={16} color="var(--accent)" />
          </div>
        </div>

        <div
          style={{
            background: "var(--paper)",
            borderRadius: 14,
            padding: "28px 30px",
            boxShadow: "inset 0 0 0 1px var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow color="var(--accent)" dot>
              Ava · friendly · Sage
            </Eyebrow>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>v3 · 1.2s</span>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 6,
              }}
            >
              Opening line
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 16.5,
                lineHeight: 1.45,
                color: "var(--ink)",
              }}
            >
              &ldquo;Hi, this is Ava calling from Numerus. I work with small businesses on their accounting tools —
              do you have a quick minute?&rdquo;
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 8,
              }}
            >
              Objectives
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Confirm you’re talking to the bookkeeper",
                "Current accounting software, if any",
                "Likes and dislikes — probe gently",
                "Offer a 15-min demo if interest is warm",
              ].map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 13.5, color: "var(--ink)" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--ink-3)",
                      minWidth: 16,
                    }}
                  >
                    0{i + 1}
                  </span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 8,
              }}
            >
              Extraction schema
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                background: "var(--paper-2)",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <div>{"{"}</div>
              <div style={{ paddingLeft: 16 }}>
                contact_role: <span style={{ color: "var(--slate)" }}>string</span>,
              </div>
              <div style={{ paddingLeft: 16 }}>
                current_software: <span style={{ color: "var(--slate)" }}>string</span>,
              </div>
              <div style={{ paddingLeft: 16 }}>
                likes: <span style={{ color: "var(--slate)" }}>text</span>,
              </div>
              <div style={{ paddingLeft: 16 }}>
                dislikes: <span style={{ color: "var(--slate)" }}>text</span>,
              </div>
              <div style={{ paddingLeft: 16 }}>
                demo_interest: <span style={{ color: "var(--accent)" }}>&apos;yes&apos; | &apos;no&apos; | &apos;maybe&apos;</span>,
              </div>
              <div style={{ paddingLeft: 16 }}>
                callback_time: <span style={{ color: "var(--slate)" }}>datetime?</span>
              </div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * What you get back
 * ──────────────────────────────────────────────────────────────────── */
function ResultCard({
  eyebrow,
  hint,
  title,
  children,
}: {
  eyebrow: React.ReactNode;
  hint: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--paper)",
        borderRadius: 14,
        padding: "22px 22px",
        boxShadow: "inset 0 0 0 1px var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>{hint}</span>
      </div>
      <div style={{ marginTop: 10, marginBottom: 16, fontSize: 16, color: "var(--ink)" }}>{title}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function WhatYouGet() {
  return (
    <section style={{ padding: "96px 56px", background: "var(--paper)" }}>
      <div style={{ marginBottom: 44 }}>
        <Eyebrow>02 · After each call</Eyebrow>
        <Display size={56} max={900}>
          Every call comes back as a transcript, a recording,
          <span style={{ color: "var(--ink-3)" }}> and the structured fields you defined.</span>
        </Display>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.9fr 1.05fr", gap: 22 }}>
        <ResultCard eyebrow="Transcript" hint="04:18" title="Searchable, timestamped">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { who: "ava", t: "00:24", text: "What are you using to track receipts and payroll today?" },
              { who: "them", t: "00:31", text: "QuickBooks. The desktop one — we’ve had it forever." },
              {
                who: "ava",
                t: "00:37",
                text: "Anything you love about it? Anything that drives you up the wall?",
              },
              {
                who: "them",
                t: "00:44",
                text: "Every month I’m doing reconciliation by hand — two evenings of my life.",
              },
            ].map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>{l.t}</div>
                <div
                  style={{
                    fontFamily: l.who === "ava" ? "var(--font-display)" : "var(--font-ui)",
                    fontStyle: l.who === "ava" ? "italic" : "normal",
                    fontSize: 12.5,
                    color: l.who === "ava" ? "var(--accent-2)" : "var(--ink)",
                    lineHeight: 1.45,
                  }}
                >
                  {l.text}
                </div>
              </div>
            ))}
          </div>
        </ResultCard>

        <ResultCard eyebrow="Recording" hint="MP3 · 4.1MB" title="Stream or download">
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 10,
              padding: "22px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--ink)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="play" size={14} color="var(--paper)" />
              </button>
              <div style={{ flex: 1 }}>
                <StaticWaveform width={260} height={32} bars={70} progress={0.34} seed={41} color="var(--ink)" />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--ink-3)",
              }}
            >
              <span>01:28</span>
              <span>04:18</span>
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: "var(--paper-2)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--ink-2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)" }}>sentiment</span>
            <Tag tone="sage">positive · 0.84</Tag>
          </div>
        </ResultCard>

        <ResultCard eyebrow="Structured data" hint="CSV · JSON · webhook" title="The fields you asked for">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["contact_role", "owner", 96],
              ["current_software", "QuickBooks Desktop", 99],
              ["likes", "familiar interface, payroll works", 82],
              ["dislikes", "manual reconciliation, no mobile", 91],
              ["demo_interest", "yes", 97],
              ["callback_time", "Tue · 2:00 PM PT", 94],
            ].map(([k, v, c]) => (
              <div
                key={k as string}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 36px",
                  gap: 8,
                  alignItems: "baseline",
                  padding: "7px 10px",
                  background: "var(--paper-2)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>
                  {k}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{v}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--sage)",
                    textAlign: "right",
                  }}
                >
                  {c}%
                </span>
              </div>
            ))}
          </div>
        </ResultCard>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Use cases (4-up)
 * ──────────────────────────────────────────────────────────────────── */
const USE_CASES = [
  {
    persona: "Sales",
    tone: "accent" as const,
    brief: "I sell accounting software. Ask if they use anything today, what it is, and what they dislike about it.",
    schema: ["current_software", "likes", "dislikes", "demo_interest"],
    persona2: "Sana · solo founder",
    stat: "142 contacts · 38 yeses",
  },
  {
    persona: "Support",
    tone: "sage" as const,
    brief: "Follow up on ticket #1234 and confirm the issue is resolved. If not, reopen with the customer’s notes.",
    schema: ["resolved", "reason_unresolved?", "wants_reopen", "csat_1_5"],
    persona2: "Marcus · ops manager",
    stat: "64 renewals · 92% reached",
  },
  {
    persona: "Research",
    tone: "slate" as const,
    brief: "Ask 5 questions about how restaurants handle online reservations. Take open-ended answers.",
    schema: ["platform_used", "pain_points", "volume_per_week", "open_to_intvw"],
    persona2: "Field research team",
    stat: "300 calls · 4 min avg",
  },
  {
    persona: "Appointments",
    tone: "amber" as const,
    brief: "Remind the patient of their appointment Tuesday 10 AM and ask if they need to reschedule.",
    schema: ["confirmed", "reschedule_to?", "wants_callback"],
    persona2: "Beck PT Clinic",
    stat: "48 reminders · 6 reschedules",
  },
];

function UseCases() {
  return (
    <section
      id="use-cases"
      style={{
        padding: "96px 56px",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <div>
          <Eyebrow>01 · Use cases</Eyebrow>
          <Display size={56} max={780}>
            Not a sales dialer. Not a support bot.
            <span style={{ color: "var(--ink-3)" }}> Whatever you can describe in a paragraph.</span>
          </Display>
        </div>
        <div style={{ maxWidth: 280, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, paddingBottom: 8 }}>
          A handful of patterns our customers run today. Bring your own — the generator handles the rest.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        {USE_CASES.map((u, i) => (
          <div
            key={i}
            style={{
              background: "var(--paper)",
              borderRadius: 14,
              padding: "22px 22px",
              boxShadow: "inset 0 0 0 1px var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minHeight: 360,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tag tone={u.tone}>{u.persona}</Tag>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>
                0{i + 1}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 15.5,
                lineHeight: 1.5,
                color: "var(--ink)",
              }}
            >
              &ldquo;{u.brief}&rdquo;
            </p>
            <div style={{ flex: 1 }} />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 6,
                }}
              >
                Extracts
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {u.schema.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "var(--paper-2)",
                      color: "var(--ink-2)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{
                paddingTop: 12,
                marginTop: 4,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--ink-3)",
              }}
            >
              <span>{u.persona2}</span>
              <span>{u.stat}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * How it works
 * ──────────────────────────────────────────────────────────────────── */
function StepCard({
  n,
  title,
  copy,
  stat,
  children,
}: {
  n: string;
  title: string;
  copy: string;
  stat: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--paper-2)",
        borderRadius: 14,
        padding: "28px 28px",
        boxShadow: "inset 0 0 0 1px var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minHeight: 360,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 56,
            lineHeight: 1,
            color: "var(--accent)",
            letterSpacing: "-0.04em",
          }}
        >
          {n}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--ink-3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {stat}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</div>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>{copy}</p>
      </div>
      <div style={{ flex: 1 }} />
      {children}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "96px 56px", background: "var(--paper)" }}>
      <div style={{ marginBottom: 48 }}>
        <Eyebrow>02 · How it works</Eyebrow>
        <Display size={56} max={780}>
          Three steps to your first call.
        </Display>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        <StepCard
          n="01"
          title="Write the brief"
          copy="A paragraph. What it’s about, who you’re calling, what you want to know. Rehearse with your browser mic if you want — talk to the agent before it talks to anyone else."
          stat="~ 2 minutes"
        >
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 10,
              padding: "14px 16px",
              boxShadow: "inset 0 0 0 1px var(--border)",
            }}
          >
            <Eyebrow>Brief</Eyebrow>
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 14,
                color: "var(--ink)",
                lineHeight: 1.5,
              }}
            >
              &ldquo;Ask 5 questions about how restaurants handle online reservations…&rdquo;
            </p>
          </div>
        </StepCard>

        <StepCard
          n="02"
          title="Upload the numbers"
          copy="Paste a list, drop a CSV, or type one. We normalize, dedupe, and scrub against the national DNC list before a single number gets dialed."
          stat="DNC scrub built-in"
        >
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 10,
              padding: "12px 14px",
              boxShadow: "inset 0 0 0 1px var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: "var(--ink-2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>+1 (415) 555-0142</span>
                <Icon name="check" size={11} color="var(--sage)" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>+1 (917) 555-0119</span>
                <Icon name="check" size={11} color="var(--sage)" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-4)" }}>
                <span style={{ textDecoration: "line-through" }}>+1 (303) 555-0188</span>
                <span style={{ fontSize: 10 }}>DNC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>+1 (305) 555-0177</span>
                <Icon name="check" size={11} color="var(--sage)" />
              </div>
            </div>
          </div>
        </StepCard>

        <StepCard
          n="03"
          title="Click call"
          copy="We dial, in your time zone window, at the concurrency you set. Watch the live feed. Stop a call, retry, or take notes mid-flight."
          stat="< 5 minutes to first call"
        >
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 10,
              padding: "12px 14px",
              boxShadow: "inset 0 0 0 1px var(--border)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--ink)" }}>Mara Ortega</span>
                <StatusPill status="completed" />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--ink)" }}>Jin Park</span>
                <StatusPill status="live" />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--ink)" }}>Hannah Weiss</span>
                <StatusPill status="ringing" />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                <span style={{ color: "var(--ink)" }}>Diego Aranda</span>
                <StatusPill status="queued" />
              </div>
            </div>
          </div>
        </StepCard>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Live ribbon
 * ──────────────────────────────────────────────────────────────────── */
function LiveRibbon() {
  return (
    <section
      style={{
        padding: "64px 56px",
        background: "var(--ink)",
        color: "var(--paper)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <Eyebrow color="var(--accent)" dot="live">
            Right now, on the network
          </Eyebrow>
          <div
            style={{
              marginTop: 14,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 44,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 760,
            }}
          >
            Across all customers — last 60 seconds.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 44,
              color: "var(--accent)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            1,284
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-4)",
              marginTop: 4,
            }}
          >
            calls in progress
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {[
          { name: "Mara Ortega", co: "Ortega Roofing", t: "02:14", status: "live" },
          { name: "Jin Park", co: "Park Family Dental", t: "00:47", status: "live" },
          { name: "Hannah Weiss", co: "Weiss & Co", t: "00:08", status: "ringing" },
          { name: "Lior Cohen", co: "Cohen Optometry", t: "01:32", status: "live" },
          { name: "Yuki Tanaka", co: "Tanaka Bakery", t: "03:51", status: "live" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,245,230,0.04)",
              border: "1px solid rgba(255,245,230,0.1)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: c.status === "live" ? "var(--accent)" : "var(--amber)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: c.status === "live" ? "var(--accent)" : "var(--amber)",
                    animation: "ac-blink 1.4s infinite",
                  }}
                />
                {c.status === "live" ? "live" : "ringing"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-4)" }}>{c.t}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--paper)" }}>{c.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 1 }}>{c.co}</div>
            <div style={{ marginTop: 12 }}>
              <Waveform
                bars={28}
                height={20}
                state={c.status === "live" ? "speaking" : "listening"}
                gap={2}
                barWidth={2}
                fill
                color={c.status === "live" ? "var(--accent)" : "var(--ink-4)"}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,245,230,0.1)",
        }}
      >
        {[
          ["p50 first response", "740ms"],
          ["Avg call completion", "3:42"],
          ["Concurrency ceiling", "200/account"],
          ["Compliance", "TCPA · DNC · AI disclosure"],
        ].map(([k, v], i) => (
          <div key={i}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
              }}
            >
              {k}
            </div>
            <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--paper)" }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Trust strip
 * ──────────────────────────────────────────────────────────────────── */
function TrustStrip() {
  return (
    <section id="trust" style={{ padding: "64px 56px", background: "var(--paper)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr", gap: 56, alignItems: "start" }}>
        <div>
          <Eyebrow>05 · Compliance is the default</Eyebrow>
          <Display size={40} max={420}>
            Built to keep your brand off a regulator&rsquo;s desk.
          </Display>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {[
            {
              t: "AI disclosure",
              c: "Every agent identifies as AI on first turn, and again whenever asked. Non-negotiable.",
            },
            {
              t: "DNC + jurisdiction",
              c: "National DNC scrub before dial. Geo-aware calling windows, honored to the minute.",
            },
            {
              t: "Opt-out detection",
              c: "“Take me off this list” ends the call, flags the number, and writes it to your DNC.",
            },
            {
              t: "Audit log",
              c: "Every call has a traceable timeline from queue → dial → connect → turns → hangup → post.",
            },
          ].map((b) => (
            <div key={b.t} style={{ paddingTop: 14, borderTop: "1px solid var(--border-2)" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-2)",
                }}
              >
                {b.t}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>{b.c}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Pricing
 * ──────────────────────────────────────────────────────────────────── */
function PriceCard({
  name,
  price,
  per,
  subtitle,
  features,
  cta,
  ctaVariant,
  featured,
}: {
  name: string;
  price: string;
  per: string;
  subtitle: string;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "accent" | "ghost";
  featured?: boolean;
}) {
  return (
    <div
      style={{
        background: featured ? "var(--ink)" : "var(--paper)",
        color: featured ? "var(--paper)" : "var(--ink)",
        borderRadius: 14,
        padding: "28px 28px",
        boxShadow: featured ? "0 22px 60px -28px rgba(26,23,20,0.6)" : "inset 0 0 0 1px var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: 480,
        position: "relative",
      }}
    >
      {featured && (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 28,
            padding: "3px 10px",
            borderRadius: 999,
            background: "var(--accent)",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Most teams
        </span>
      )}
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: featured ? "var(--ink-4)" : "var(--ink-3)",
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: featured ? "var(--paper)" : "var(--ink)",
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: featured ? "var(--ink-4)" : "var(--ink-3)",
            }}
          >
            {per}
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: featured ? "var(--ink-4)" : "var(--ink-2)" }}>
          {subtitle}
        </div>
      </div>

      <div style={{ height: 1, background: featured ? "rgba(255,245,230,0.1)" : "var(--border)" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
            <Icon name="check" size={12} color={featured ? "var(--accent)" : "var(--sage)"} />
            <span style={{ fontSize: 13.5, color: featured ? "var(--paper)" : "var(--ink)" }}>{f}</span>
          </div>
        ))}
      </div>

      <Button variant={ctaVariant} size="lg" full>
        {cta}{" "}
        <Icon name="arrow" size={13} color={ctaVariant === "accent" || ctaVariant === "primary" ? "#fff" : "var(--ink)"} />
      </Button>
    </div>
  );
}

function Pricing() {
  return (
    <section
      id="pricing"
      style={{
        padding: "96px 56px",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ marginBottom: 44 }}>
        <Eyebrow>03 · Pricing</Eyebrow>
        <Display size={56} max={780}>
          Prepaid minutes.
          <span style={{ color: "var(--ink-3)" }}> No surprise invoice on Monday morning.</span>
        </Display>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
        <PriceCard
          name="Free"
          price="$0"
          per="10 minutes"
          subtitle="Kick the tires"
          features={[
            "Brief → agent generator",
            "Talk-to-your-agent rehearsal",
            "Up to 5 contacts per campaign",
            "CSV export",
            "Watermark on recordings",
          ]}
          cta="Start free"
          ctaVariant="ghost"
        />
        <PriceCard
          name="Pro"
          price="$0.18"
          per="per minute"
          subtitle="For most teams"
          features={[
            "Everything in Free",
            "Up to 50 concurrent calls",
            "Premium voices & personas",
            "HubSpot push, webhooks",
            "No watermark · full audit log",
            "Auto-recharge optional",
          ]}
          cta="Start Pro"
          ctaVariant="accent"
          featured
        />
        <PriceCard
          name="Scale"
          price="Custom"
          per="committed volume"
          subtitle="50k+ minutes / mo"
          features={[
            "Everything in Pro",
            "Up to 500 concurrent calls",
            "Voice cloning · custom personas",
            "Salesforce, BYO telephony",
            "Dedicated phone numbers",
            "Compliance review on file",
          ]}
          cta="Talk to us"
          ctaVariant="primary"
        />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Final CTA
 * ──────────────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section
      style={{
        padding: "120px 56px 100px",
        background: "var(--paper)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <Wordmark size={28} live />
      <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
        <Display size={92} max={1000}>
          Type what you want.
          <br />
          <span style={{ color: "var(--accent)" }}>Click call.</span>
        </Display>
      </div>
      <p
        style={{
          margin: "28px auto 0",
          maxWidth: 540,
          fontSize: 16,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        Ten minutes free. No card. Talk to your agent first if you want — we wait until you say go.
      </p>
      <div style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 12 }}>
        <Link href="/signup" style={{ textDecoration: "none" }}>
          <Button variant="accent" size="lg" icon={<Icon name="phone" size={14} color="#fff" />}>
            Start free
          </Button>
        </Link>
        <Button variant="ghost" size="lg">
          Book a walkthrough
        </Button>
      </div>

      <div
        style={{
          marginTop: 60,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--ink-3)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <span>SOC 2 in progress</span>
        <span>·</span>
        <span>TCPA-aware</span>
        <span>·</span>
        <span>GDPR-ready</span>
        <span>·</span>
        <span>US numbers · v1</span>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Footer
 * ──────────────────────────────────────────────────────────────────── */
function HomeFooter() {
  const col: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
  const link: React.CSSProperties = { fontSize: 13, color: "var(--ink-2)", cursor: "pointer" };
  const head: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--ink-3)",
    marginBottom: 6,
  };
  return (
    <footer
      style={{
        padding: "48px 56px 36px",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <Wordmark size={20} live />
          <p
            style={{
              margin: "14px 0 0",
              fontSize: 13,
              color: "var(--ink-2)",
              maxWidth: 280,
              lineHeight: 1.5,
            }}
          >
            A voice-forward tool for anyone who needs a few hundred conversations completed — well.
          </p>
        </div>
        <div style={col}>
          <div style={head}>Product</div>
          <a href="#how-it-works" style={link}>How it works</a>
          <a href="#use-cases" style={link}>Use cases</a>
          <a href="#pricing" style={link}>Pricing</a>
          <a href="#trust" style={link}>Trust</a>
        </div>
        <div style={col}>
          <div style={head}>Resources</div>
          <span style={link}>Docs</span>
          <span style={link}>Brief library</span>
          <span style={link}>API reference</span>
          <span style={link}>HubSpot guide</span>
        </div>
        <div style={col}>
          <div style={head}>Company</div>
          <span style={link}>About</span>
          <span style={link}>Customers</span>
          <span style={link}>Acceptable use</span>
          <span style={link}>Careers</span>
        </div>
        <div style={col}>
          <div style={head}>Legal</div>
          <span style={link}>Terms</span>
          <span style={link}>Privacy</span>
          <span style={link}>DPA</span>
          <span style={link}>Security</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--ink-3)",
          letterSpacing: "0.04em",
        }}
      >
        <span>© 2026 any/call, inc. · Made in Brooklyn</span>
        <span>v1.0 · public beta · 1,284 calls in progress</span>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Composed landing page
 * ──────────────────────────────────────────────────────────────────── */
/* Tightened home — Hero → Use cases → How it works → Pricing → CTA → Footer.
 * Cut sections (TransformationSection, WhatYouGet, LiveRibbon, TrustStrip)
 * are still defined below but no longer rendered; easy to re-add if a
 * future variant needs them. */
export default function HomePage() {
  return (
    <div
      className="home-page"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <HomeNav />
      <HomeHero />
      <Customers />
      <UseCases />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
      <HomeFooter />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Customers — "Trusted by" strip. Favicon via Google's public service +
 * wordmark text + link. If/when proper brand assets are dropped into
 * web/public/customers/, swap the src on each <img>.
 * ──────────────────────────────────────────────────────────────────── */
const CUSTOMERS = [
  { name: "Bookingwhizz", domain: "bookingwhizz.com" },
  { name: "Blissmart",    domain: "blissmart.com" },
  { name: "Simply Park",  domain: "simplypark.com" },
];

function Customers() {
  return (
    <section
      className="home-customers"
      style={{
        padding: "48px 56px",
        background: "var(--paper)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      <Eyebrow>Trusted by</Eyebrow>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
        }}
      >
        {CUSTOMERS.map((c) => (
          <a
            key={c.domain}
            href={`https://${c.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              borderRadius: 10,
              textDecoration: "none",
              color: "var(--ink-2)",
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--paper-2)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--ink-2)";
            }}
          >
            {/* Favicon via Google's public service. eslint-disable: this is
                an intentional <img>, not next/image — keeps the src dynamic
                and avoids configuring remote-image patterns. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
              alt=""
              width={20}
              height={20}
              style={{ borderRadius: 4 }}
            />
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.005em" }}>{c.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
