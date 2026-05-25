"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";
import { deleteBrief, listBriefs, type Brief } from "@/lib/api";
import { PERSONAS, VOICES } from "@/lib/personas";

export default function BriefsPage() {
  const [items, setItems] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await listBriefs();
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function remove(b: Brief) {
    if (!confirm(`Delete brief "${b.name}"?`)) return;
    try {
      await deleteBrief(b.id);
      setItems((cs) => cs.filter((x) => x.id !== b.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
          <div>
            <Eyebrow>Library · briefs</Eyebrow>
            <h1
              style={{
                margin: "8px 0 0",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Saved briefs
            </h1>
            <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-2)" }}>
              Write a brief once, start campaigns from it later.
            </p>
          </div>
          <Link href="/briefs/new" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<Icon name="plus" size={12} color="var(--paper)" />}>
              New brief
            </Button>
          </Link>
        </div>

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

        {loading ? (
          <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {items.map((b) => (
              <BriefCard key={b.id} brief={b} onDelete={() => remove(b)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function BriefCard({ brief, onDelete }: { brief: Brief; onDelete: () => void }) {
  const persona = PERSONAS.find((p) => p.id === brief.persona)?.label || brief.persona;
  const voice = VOICES.find((v) => v.id === brief.voice)?.name || brief.voice;
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
        <Tag tone={brief.type === "sales" ? "accent" : brief.type === "survey" ? "sage" : "neutral"}>{brief.type}</Tag>
        <button
          onClick={onDelete}
          aria-label="Delete brief"
          style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer" }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      <Link href={`/briefs/${brief.id}`} style={{ color: "inherit", textDecoration: "none" }}>
        <div style={{ fontWeight: 500, fontSize: 16, color: "var(--ink)" }}>{brief.name}</div>
        <p
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 13.5,
            color: "var(--ink-2)",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {brief.brief || "(no brief text yet)"}
        </p>
      </Link>
      <div style={{ flex: 1 }} />
      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--ink-3)",
        }}
      >
        <span>{persona} · {voice}</span>
        <span>used {brief.usageCount}×</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 24px",
        background: "var(--paper-2)",
        borderRadius: 14,
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.1,
        }}
      >
        No saved briefs yet.
      </h2>
      <p style={{ margin: "10px 0 24px", color: "var(--ink-2)", fontSize: 14 }}>
        Write briefs you reuse — first-call follow-ups, NPS scripts, sales pitches.
      </p>
      <Link href="/briefs/new" style={{ textDecoration: "none" }}>
        <Button variant="accent" size="lg" icon={<Icon name="plus" size={13} color="#fff" />}>
          New brief
        </Button>
      </Link>
    </div>
  );
}
