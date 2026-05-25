"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";

export default function NumbersPage() {
  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 880 }}>
        <Eyebrow>Library · numbers & voices</Eyebrow>
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
          Numbers & voices
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Card
            eyebrow="Outbound numbers"
            title="No numbers provisioned"
            blurb="Each workspace needs at least one Twilio number to dial from. We provision US + UK numbers per region so caller-ID matches the recipient."
            cta="Provision a number"
            disabled
            disabledReason="Waiting on Twilio account credentials (see PRD §8)."
          />
          <Card
            eyebrow="Voices"
            title="Default catalog · 4 standard + 3 premium"
            blurb="Sage, Aria, Brook, Theo on the standard tier; Lior, Nico, Mira on the premium tier. Voice cloning lands in a follow-up."
            cta="Browse voice catalog"
            disabled
            disabledReason="Wired to ElevenLabs once the voice-AI provider is chosen."
          />
        </div>
      </div>
    </AppShell>
  );
}

function Card({
  eyebrow,
  title,
  blurb,
  cta,
  disabled,
  disabledReason,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  cta: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div
      style={{
        background: "var(--paper-2)",
        borderRadius: 14,
        padding: "20px 22px",
        boxShadow: "inset 0 0 0 1px var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 220,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        {disabled && <Tag tone="amber">pending</Tag>}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{blurb}</p>
      <div style={{ flex: 1 }} />
      <Button
        variant="ghost"
        size="md"
        disabled={disabled}
        icon={<Icon name="plus" size={12} color={disabled ? "var(--ink-3)" : "var(--ink)"} />}
      >
        {cta}
      </Button>
      {disabledReason && (
        <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.45 }}>{disabledReason}</div>
      )}
    </div>
  );
}
