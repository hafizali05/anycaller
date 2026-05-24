"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon } from "@/components/ui";
import { deleteCampaign, listCampaigns, type Campaign, type CampaignStatus } from "@/lib/api";

const STATUS_TONES: Record<CampaignStatus, { bg: string; color: string; label: string }> = {
  draft:     { bg: "transparent",          color: "var(--ink-3)",   label: "Draft" },
  scheduled: { bg: "var(--amber-soft)",    color: "var(--amber)",   label: "Scheduled" },
  running:   { bg: "var(--accent-soft)",   color: "var(--accent-2)",label: "Running" },
  paused:    { bg: "var(--paper-3)",       color: "var(--ink-2)",   label: "Paused" },
  completed: { bg: "var(--sage-soft)",     color: "var(--sage)",    label: "Completed" },
};

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await listCampaigns();
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

  async function remove(c: Campaign) {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    try {
      await deleteCampaign(c.id);
      setItems((cs) => cs.filter((x) => x.id !== c.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Eyebrow>Now · campaigns</Eyebrow>
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
              Campaigns
            </h1>
          </div>
          <Link href="/campaigns/new" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<Icon name="plus" size={12} color="var(--paper)" />}>
              New campaign
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
          <div
            style={{
              background: "var(--paper)",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.8fr 100px 110px 1.4fr 130px 60px",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              <span>Campaign</span>
              <span>Type</span>
              <span>Status</span>
              <span>Audience</span>
              <span>Updated</span>
              <span></span>
            </div>
            {items.map((c, i) => {
              const tone = STATUS_TONES[c.status];
              return (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 100px 110px 1.4fr 130px 60px",
                    padding: "14px 16px",
                    alignItems: "center",
                    fontSize: 13.5,
                    color: "var(--ink)",
                    borderBottom: i === items.length - 1 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <Link
                    href={c.status === "draft" ? `/campaigns/${c.id}/edit` : `/campaigns/${c.id}`}
                    style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 500 }}
                  >
                    {c.name}
                  </Link>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)" }}>
                    {c.type}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: tone.bg,
                      color: tone.color,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      width: "fit-content",
                    }}
                  >
                    {tone.label}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                    {c.audienceTags.length === 0 ? (
                      <span style={{ color: "var(--ink-3)" }}>all contacts</span>
                    ) : (
                      c.audienceTags.join(", ")
                    )}
                    {c.contactCount > 0 && (
                      <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                        {" "}
                        · {c.contactCount}
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => remove(c)}
                    aria-label="Delete campaign"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ink-3)",
                      cursor: "pointer",
                      justifySelf: "end",
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
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
          letterSpacing: "-0.02em",
        }}
      >
        No campaigns yet.
      </h2>
      <p style={{ margin: "10px 0 24px", color: "var(--ink-2)", fontSize: 14 }}>
        Describe what you want the agent to ask, pick an audience, and click call.
      </p>
      <Link href="/campaigns/new" style={{ textDecoration: "none" }}>
        <Button variant="accent" size="lg" icon={<Icon name="plus" size={13} color="#fff" />}>
          New campaign
        </Button>
      </Link>
    </div>
  );
}
