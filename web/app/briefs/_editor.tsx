"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon } from "@/components/ui";
import { type Brief, type CampaignType, type Pace } from "@/lib/api";
import { CAMPAIGN_TYPES, PERSONAS, VOICES } from "@/lib/personas";

const SAMPLE_BRIEF = `I'm selling accounting software to small businesses in the US. Please call the business, confirm you're speaking with someone who handles their books, and ask: (1) whether they currently use any accounting software, (2) which one, (3) what they like and dislike about it, and (4) whether they'd be open to a 15-minute demo next week. Be friendly and don't push if they say no.`;

export function BriefEditor({
  title,
  initial,
  saving,
  error,
  onSave,
}: {
  title: string;
  initial?: Partial<Brief>;
  saving: boolean;
  error: string;
  onSave: (form: Partial<Brief>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "Untitled brief");
  const [type, setType] = useState<CampaignType>((initial?.type as CampaignType) ?? "sales");
  const [brief, setBrief] = useState(initial?.brief ?? SAMPLE_BRIEF);
  const [persona, setPersona] = useState(initial?.persona ?? "formal");
  const [voice, setVoice] = useState(initial?.voice ?? "sage");
  const [pace, setPace] = useState<Pace>((initial?.pace as Pace) ?? "natural");

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 920 }}>
        <Link
          href="/briefs"
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
            marginBottom: 10,
          }}
        >
          ← Back to briefs
        </Link>

        <Eyebrow>Brief</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 40,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: "var(--paper-2)",
            borderRadius: 14,
            padding: "20px 22px",
            boxShadow: "inset 0 0 0 1px var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Field label="Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={textInput} />
          </Field>

          <Field label="Type">
            <div style={{ display: "flex", gap: 8 }}>
              {CAMPAIGN_TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--paper)" : "var(--ink-2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      textTransform: "capitalize",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Brief — describe the call in plain language">
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={10}
              style={{
                ...textInput,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 15,
                lineHeight: 1.55,
                resize: "vertical",
              }}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Persona">
              <select value={persona} onChange={(e) => setPersona(e.target.value)} style={textInput}>
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}{p.tier === "premium" ? " (premium)" : ""}</option>
                ))}
              </select>
            </Field>
            <Field label="Voice">
              <select value={voice} onChange={(e) => setVoice(e.target.value)} style={textInput}>
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} · {v.tags}</option>
                ))}
              </select>
            </Field>
            <Field label="Pace">
              <select value={pace} onChange={(e) => setPace(e.target.value as Pace)} style={textInput}>
                <option value="slow">slow</option>
                <option value="natural">natural</option>
                <option value="fast">fast</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button
              variant="accent"
              size="lg"
              onClick={() => onSave({ name, type, brief, persona, voice, pace })}
              disabled={saving || !name.trim()}
              icon={<Icon name="check" size={13} color="#fff" />}
            >
              {saving ? "Saving…" : "Save brief"}
            </Button>
            {initial?.id && (
              <Link href={`/campaigns/new?fromBrief=${encodeURIComponent(initial.id)}`} style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="lg" icon={<Icon name="phone" size={13} color="var(--ink)" />}>
                  Start campaign from this brief
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const textInput: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-2)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: 14,
  outline: "none",
};
