"use client";

/* Call detail — transcript, recording scrubber, extracted fields.
 * Port of designs/app-screens-run.jsx ScreenCallDetail. */

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon, StaticWaveform, StatusPill, Tag } from "@/components/ui";
import { getCall, listContacts, type Call, type Contact, type TranscriptLine } from "@/lib/api";

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [call, setCall] = useState<Call | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await getCall(id);
        setCall(c);
        const cts = await listContacts();
        setContact(cts.items.find((x) => x.id === c.contactId) || null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <AppShell>
      <div style={{ padding: "24px 32px", maxWidth: 1000 }}>
        <Link
          href={call ? `/campaigns/${call.campaignId}` : "/campaigns"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            textDecoration: "none",
            marginBottom: 14,
          }}
        >
          ← Back to campaign
        </Link>

        {loading && <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        {call && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 18 }}>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 32,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {contact?.name || "Unknown"}
                </h1>
                <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                  {contact?.company || ""} · {contact?.phone || "—"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusPill status={call.status === "live" || call.status === "completed" || call.status === "ringing" || call.status === "voicemail" || call.status === "failed" || call.status === "optout" || call.status === "queued" ? call.status : "queued"} />
                {call.sentiment && <Tag tone="sage">sentiment · {call.sentiment}</Tag>}
                <Tag tone="outline">attempt {call.attempt}</Tag>
              </div>
            </div>

            {/* Recording strip */}
            <div
              style={{
                background: "var(--paper-2)",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "inset 0 0 0 1px var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <button
                disabled={!call.recordingUrl}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--ink)",
                  border: "none",
                  cursor: call.recordingUrl ? "pointer" : "not-allowed",
                  opacity: call.recordingUrl ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="play" size={14} color="var(--paper)" />
              </button>
              <div style={{ flex: 1 }}>
                <StaticWaveform width={720} height={32} bars={120} progress={0} seed={51} color="var(--ink-2)" />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                {fmtDuration(call.durationSec)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
              {/* Transcript */}
              <div
                style={{
                  background: "var(--paper)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                }}
              >
                <SectionHead>Transcript</SectionHead>
                {call.transcript.length === 0 ? (
                  <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 13 }}>
                    No transcript yet — it lands here once the call has been processed.
                  </p>
                ) : (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                    {call.transcript.map((line, i) => (
                      <TranscriptRow key={i} line={line} />
                    ))}
                  </div>
                )}
              </div>

              {/* Extraction */}
              <div
                style={{
                  background: "var(--paper-2)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  alignSelf: "start",
                }}
              >
                <SectionHead>Extracted fields</SectionHead>
                {Object.keys(call.extraction).length === 0 ? (
                  <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 13 }}>
                    Nothing extracted yet.
                  </p>
                ) : (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(call.extraction).map(([k, v]) => (
                      <ExtractionRow key={k} k={k} value={String(v.value)} confidence={v.confidence ?? null} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
      }}
    >
      {children}
    </div>
  );
}

function TranscriptRow({ line }: { line: TranscriptLine }) {
  const isAva = line.who === "ava";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: 12, alignItems: "baseline" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{line.t}</div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: isAva ? "var(--accent)" : "var(--ink-3)",
            marginBottom: 2,
          }}
        >
          {isAva ? "Ava" : "Caller"}
        </div>
        <div
          style={{
            fontFamily: isAva ? "var(--font-display)" : "var(--font-ui)",
            fontStyle: isAva ? "italic" : "normal",
            fontSize: isAva ? 15 : 14,
            color: "var(--ink)",
            lineHeight: 1.5,
          }}
        >
          {line.text}
        </div>
      </div>
    </div>
  );
}

function ExtractionRow({ k, value, confidence }: { k: string; value: string; confidence: number | null }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 50px",
        gap: 10,
        alignItems: "baseline",
        padding: "8px 10px",
        background: "var(--paper)",
        borderRadius: 6,
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{k}</span>
      <span style={{ fontSize: 13, color: "var(--ink)" }}>{value}</span>
      {confidence != null && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sage)", textAlign: "right" }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
}

function fmtDuration(sec: number | null): string {
  if (sec == null) return "—";
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
