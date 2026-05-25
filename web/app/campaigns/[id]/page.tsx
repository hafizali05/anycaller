"use client";

/* Live feed — campaign monitor. Reads /calls?campaignId=... on a 5s
 * poll. Ports the visual structure of designs/app-screens-run.jsx
 * ScreenLive but trades the design's setInterval ticker for real
 * data from DDB. */

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Icon, StaticWaveform, StatusPill, Waveform } from "@/components/ui";
import { getCampaign, listCalls, listContacts, type Call, type Campaign, type CallStatus, type Contact } from "@/lib/api";

const POLL_MS = 5000;

export default function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [contactsById, setContactsById] = useState<Record<string, Contact>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        const [camp, cs, cts] = await Promise.all([getCampaign(id), listCalls(id), listContacts()]);
        if (cancelled) return;
        setCampaign(camp);
        setCalls(cs.items);
        const byId: Record<string, Contact> = {};
        for (const c of cts.items) byId[c.id] = c;
        setContactsById(byId);
        setError("");
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOnce();
    const poll = setInterval(loadOnce, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [id]);

  const counts = countByStatus(calls);
  const yes = calls.filter((c) => c.outcome === "yes").length;
  const maybe = calls.filter((c) => c.outcome === "maybe").length;
  const no = calls.filter((c) => c.outcome === "no").length;

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header campaign={campaign} loading={loading} />

        {error && (
          <div
            style={{
              margin: "12px 28px",
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            borderBottom: "1px solid var(--border)",
            background: "var(--paper-2)",
          }}
        >
          <Counter big n={counts.live} label="Live now" live />
          <Counter n={counts.ringing} label="Ringing" tone="amber" />
          <Counter n={counts.queued} label="Queued" />
          <Counter n={counts.completed} label="Completed" tone="sage" />
          <Counter n={counts.voicemail} label="Voicemail" />
          <Counter n={counts.failed} label="No answer" />
        </div>

        <div
          style={{
            padding: "12px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Outcomes so far
          </span>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--paper-3)",
            }}
          >
            <div style={{ flex: yes, background: "var(--sage)", height: "100%" }} />
            <div style={{ flex: maybe, background: "var(--amber)", height: "100%" }} />
            <div style={{ flex: no, background: "var(--ink-3)", height: "100%" }} />
            <div style={{ flex: Math.max(0, calls.length - yes - maybe - no), background: "transparent", height: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
            <Legend dot="var(--sage)" label={`${yes} yes`} />
            <Legend dot="var(--amber)" label={`${maybe} maybe`} />
            <Legend dot="var(--ink-3)" label={`${no} no`} />
          </div>
        </div>

        {calls.length === 0 && !loading ? (
          <EmptyState campaignId={id} />
        ) : (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.4fr 1.1fr 100px 100px 1fr 24px",
                padding: "10px 28px",
                position: "sticky",
                top: 0,
                background: "var(--paper)",
                borderBottom: "1px solid var(--border)",
                zIndex: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              <span>Contact</span>
              <span>Company</span>
              <span>Status</span>
              <span>Duration</span>
              <span>Outcome</span>
              <span>Snippet / VU</span>
              <span></span>
            </div>
            {calls.map((c) => (
              <CallRow key={c.id} call={c} contact={contactsById[c.contactId]} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Header({ campaign, loading }: { campaign: Campaign | null; loading: boolean }) {
  return (
    <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div>
        <Link
          href="/campaigns"
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
            marginBottom: 6,
          }}
        >
          {campaign ? `${campaign.type} · ${campaign.status}` : loading ? "Loading…" : "Campaign"}
        </Link>
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
          {campaign?.name || "—"}
        </h1>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {campaign?.contactCount ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {campaign.contactCount} contacts
          </span>
        ) : null}
        {campaign?.status === "running" && (
          <Button variant="ghost" size="sm" icon={<Icon name="pause" size={11} color="var(--ink)" />}>
            Pause
          </Button>
        )}
      </div>
    </div>
  );
}

function Counter({ n, label, tone, big, live }: { n: number; label: string; tone?: "sage" | "amber"; big?: boolean; live?: boolean }) {
  const color = tone === "sage" ? "var(--sage)" : tone === "amber" ? "var(--amber)" : live ? "var(--accent)" : "var(--ink)";
  return (
    <div style={{ padding: big ? "18px 22px" : "14px 22px", borderRight: "1px solid var(--border)" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "ac-blink 1.4s ease-in-out infinite" }} />}
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          fontSize: big ? 36 : 26,
          color,
          letterSpacing: "-0.02em",
          marginTop: 4,
          lineHeight: 1.05,
        }}
      >
        {n}
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
      {label}
    </span>
  );
}

function CallRow({ call, contact }: { call: Call; contact: Contact | undefined }) {
  const isLive = call.status === "live";
  const isDone = call.status === "completed";
  const duration = call.durationSec ? `${String(Math.floor(call.durationSec / 60)).padStart(2, "0")}:${String(call.durationSec % 60).padStart(2, "0")}` : "—";
  const outcomeTone = call.outcome === "yes" ? "sage" : call.outcome === "no" ? "ink-3" : call.outcome === "maybe" ? "amber" : null;
  return (
    <Link
      href={isDone ? `/calls/${call.id}` : "#"}
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1.4fr 1.1fr 100px 100px 1fr 24px",
        padding: "14px 28px",
        alignItems: "center",
        fontSize: 13,
        color: "var(--ink)",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        background: isLive ? "var(--accent-soft)" : "transparent",
      }}
    >
      <div>
        <div style={{ fontWeight: 500 }}>{contact?.name || "—"}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{contact?.phone || ""}</div>
      </div>
      <span style={{ color: "var(--ink-2)" }}>{contact?.company || ""}</span>
      <div>
        <StatusPill status={call.status as Exclude<CallStatus, never>} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: isLive ? "var(--accent)" : "var(--ink-2)" }}>{duration}</span>
      <div>
        {call.outcome ? (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              background: outcomeTone === "sage" ? "var(--sage-soft)" : outcomeTone === "amber" ? "var(--amber-soft)" : "transparent",
              color: outcomeTone === "sage" ? "var(--sage)" : outcomeTone === "amber" ? "var(--amber)" : "var(--ink-3)",
              boxShadow: !outcomeTone ? "inset 0 0 0 1px var(--border-2)" : undefined,
            }}
          >
            {call.outcome}
          </span>
        ) : (
          <span style={{ color: "var(--ink-3)" }}>—</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--ink-2)" }}>
        {isLive && <Waveform bars={14} height={20} state="speaking" gap={2} barWidth={2} />}
        {isDone && <StaticWaveform width={60} height={20} bars={20} seed={call.id.charCodeAt(0) + 3} color="var(--ink-3)" />}
        {call.snippet && (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{call.snippet}</span>
        )}
      </div>
      <Icon name="chev" size={14} color="var(--ink-4)" />
    </Link>
  );
}

function EmptyState({ campaignId }: { campaignId: string }) {
  return (
    <div style={{ flex: 1, padding: "64px 28px", textAlign: "center", color: "var(--ink-3)" }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 22,
          color: "var(--ink-2)",
        }}
      >
        No calls yet.
      </p>
      <p style={{ marginTop: 8, fontSize: 13 }}>
        Once the worker is online and this campaign launches, every call attempt shows up here.
      </p>
      <p style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-4)" }}>
        campaign · {campaignId}
      </p>
    </div>
  );
}

function countByStatus(calls: Call[]): Record<CallStatus, number> {
  const c: Record<CallStatus, number> = { queued: 0, ringing: 0, live: 0, completed: 0, voicemail: 0, failed: 0, optout: 0 };
  for (const x of calls) c[x.status] = (c[x.status] || 0) + 1;
  return c;
}
