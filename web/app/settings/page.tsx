"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";
import { fetchMe, type Me } from "@/lib/api";
import { loadAttestation } from "@/components/AttestModal";

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [attest, setAttest] = useState<ReturnType<typeof loadAttestation>>(null);

  useEffect(() => {
    setAttest(loadAttestation());
    (async () => {
      try {
        setMe(await fetchMe());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const envPool = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";
  const envClient = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || "";
  const envRegion = process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2";

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 760 }}>
        <Eyebrow>Settings</Eyebrow>
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
          Account & workspace
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

        <Section title="Profile">
          <Row k="Email" v={me?.email || "—"} />
          <Row k="User sub" v={me?.sub || "—"} mono />
        </Section>

        <Section title="Workspace">
          <Row k="Name" v={me?.workspace.name || "—"} />
          <Row k="ID" v={me?.workspace.id || "—"} mono />
          <Row k="Created" v={me ? new Date(me.workspace.createdAt).toLocaleString() : "—"} mono />
        </Section>

        <Section title="Compliance">
          {attest ? (
            <>
              <Row k="Basis" v={attest.basis} />
              <Row k="Last acknowledged" v={new Date(attest.acknowledgedAt).toLocaleString()} mono />
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>
              No attestation on record yet — you&rsquo;ll be prompted before your first launch.
            </p>
          )}
        </Section>

        <Section title="Connection">
          <Row k="Region" v={envRegion} mono />
          <Row k="API base" v={envBase || "— (not set)"} mono />
          <Row k="Cognito pool" v={envPool || "— (not set)"} mono />
          <Row k="App client" v={envClient || "— (not set)"} mono />
          {(!envBase || !envPool || !envClient) && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "var(--amber-soft)",
                color: "var(--amber)",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                lineHeight: 1.5,
              }}
            >
              Set NEXT_PUBLIC_* env vars from your SAM stack outputs, then rebuild the frontend.
            </div>
          )}
        </Section>

        <Section title="Plan">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Tag tone="sage">Free</Tag>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>10 minutes on the house · no card.</span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
            Stripe top-up + Pro/Scale upgrades land in a follow-up slice once the voice provider is chosen
            and per-minute pricing is locked.
          </p>
        </Section>

        <Section title="Danger zone">
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>
            Delete workspace and all data. Hard delete; no recovery. (Not wired yet — needs an admin
            confirm flow on the backend.)
          </p>
          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" size="md" icon={<Icon name="x" size={13} color="var(--accent-2)" />} disabled>
              Delete workspace
            </Button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--paper-2)",
        borderRadius: 14,
        padding: "20px 22px",
        boxShadow: "inset 0 0 0 1px var(--border)",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 16,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--ink-3)" }}>{k}</span>
      <span style={{ color: "var(--ink)", fontFamily: mono ? "var(--font-mono)" : undefined, wordBreak: "break-all" }}>
        {v}
      </span>
    </div>
  );
}
