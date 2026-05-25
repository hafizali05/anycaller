"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon } from "@/components/ui";
import {
  fetchMe,
  listBriefs,
  listCalls,
  listCampaigns,
  listContacts,
  type Campaign,
  type Me,
} from "@/lib/api";

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [counts, setCounts] = useState<{
    contacts: number;
    contactsDnc: number;
    campaigns: number;
    campaignsRunning: number;
    briefs: number;
    calls: number;
    callsCompleted: number;
    callsYes: number;
  } | null>(null);
  const [recent, setRecent] = useState<Campaign[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, contacts, campaigns, briefs, calls] = await Promise.all([
          fetchMe(),
          listContacts(),
          listCampaigns(),
          listBriefs(),
          listCalls(),
        ]);
        setMe(m);
        setRecent(campaigns.items.slice(0, 3));
        setCounts({
          contacts: contacts.items.length,
          contactsDnc: contacts.items.filter((c) => c.dnc).length,
          campaigns: campaigns.items.length,
          campaignsRunning: campaigns.items.filter((c) => c.status === "running" || c.status === "scheduled").length,
          briefs: briefs.items.length,
          calls: calls.items.length,
          callsCompleted: calls.items.filter((c) => c.status === "completed").length,
          callsYes: calls.items.filter((c) => c.outcome === "yes").length,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 1080 }}>
        <Eyebrow>Dashboard</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 44,
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

        {/* KPI strip */}
        {counts && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <Kpi label="Contacts" main={counts.contacts} sub={`${counts.contactsDnc} on DNC`} />
            <Kpi
              label="Campaigns"
              main={counts.campaigns}
              sub={`${counts.campaignsRunning} live or scheduled`}
              accent={counts.campaignsRunning > 0}
            />
            <Kpi label="Briefs" main={counts.briefs} sub="reusable templates" />
            <Kpi
              label="Calls"
              main={counts.callsCompleted}
              sub={`${counts.callsYes} yes`}
              tone="sage"
            />
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <ActionCard href="/campaigns/new" icon="phone" title="New campaign" blurb="Brief → contacts → launch." accent />
          <ActionCard href="/contacts/import" icon="upload" title="Import CSV" blurb="Drag-and-drop a list of phones." />
          <ActionCard href="/briefs/new" icon="brief" title="New brief" blurb="Write a reusable template." />
        </div>

        {/* Recent campaigns */}
        {recent.length > 0 && (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 10,
              }}
            >
              Recent campaigns
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/campaigns/${c.id}`}
                  style={{
                    padding: "12px 16px",
                    background: "var(--paper-2)",
                    borderRadius: 10,
                    boxShadow: "inset 0 0 0 1px var(--border)",
                    color: "var(--ink)",
                    textDecoration: "none",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                    {c.type} · {c.status}
                  </span>
                  <Icon name="chev" size={14} color="var(--ink-4)" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  main,
  sub,
  tone,
  accent,
}: {
  label: string;
  main: number;
  sub?: string;
  tone?: "sage" | "amber";
  accent?: boolean;
}) {
  const color = tone === "sage" ? "var(--sage)" : tone === "amber" ? "var(--amber)" : accent ? "var(--accent)" : "var(--ink)";
  return (
    <div
      style={{
        background: "var(--paper-2)",
        borderRadius: 14,
        padding: "20px 22px",
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 36,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color,
        }}
      >
        {main}
      </div>
      {sub && <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>{sub}</div>}
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  blurb,
  accent,
}: {
  href: string;
  icon: string;
  title: string;
  blurb: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "18px 20px",
        background: accent ? "var(--ink)" : "var(--paper-2)",
        color: accent ? "var(--paper)" : "var(--ink)",
        borderRadius: 12,
        boxShadow: accent ? "0 10px 30px -18px rgba(26,23,20,0.5)" : "inset 0 0 0 1px var(--border)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={16} color={accent ? "var(--accent)" : "var(--accent)"} />
        <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
      </div>
      <span style={{ fontSize: 13, color: accent ? "var(--ink-4)" : "var(--ink-2)", lineHeight: 1.5 }}>{blurb}</span>
    </Link>
  );
}
