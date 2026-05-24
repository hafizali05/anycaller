"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Eyebrow, Icon } from "@/components/ui";
import { fetchMe, type Me } from "@/lib/api";

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setMe(await fetchMe());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 920 }}>
        <Eyebrow>Dashboard</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 48,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {loading ? "Loading…" : me ? `Welcome to ${me.workspace.name}.` : "Welcome."}
        </h1>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 8,
          }}
        >
          <ActionCard
            href="/contacts"
            icon="list"
            title="Contacts"
            blurb="Upload a CSV, manage tags, mark DNC."
          />
          <ActionCard
            href="/contacts/import"
            icon="upload"
            title="Import CSV"
            blurb="Drag-and-drop. We normalize phones and skip duplicates."
          />
        </div>

        {me && (
          <div
            style={{
              marginTop: 32,
              background: "var(--paper-2)",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "inset 0 0 0 1px var(--border)",
              display: "grid",
              gridTemplateColumns: "max-content 1fr",
              rowGap: 8,
              columnGap: 20,
              fontSize: 13,
            }}
          >
            <Field label="Email" value={me.email || "—"} />
            <Field label="Workspace ID" value={me.workspace.id} mono />
            <Field label="Created" value={me.workspace.createdAt} mono />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ActionCard({ href, icon, title, blurb }: { href: string; icon: string; title: string; blurb: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "20px 22px",
        background: "var(--paper-2)",
        borderRadius: 12,
        boxShadow: "inset 0 0 0 1px var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={16} color="var(--accent)" />
        <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
      </div>
      <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{blurb}</span>
    </Link>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          alignSelf: "baseline",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          color: "var(--ink)",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </>
  );
}
