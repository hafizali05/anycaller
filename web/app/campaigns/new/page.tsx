"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AttestModal, loadAttestation } from "@/components/AttestModal";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";
import {
  createCampaign,
  launchCampaign,
  listContacts,
  patchCampaign,
  type Campaign,
  type CampaignType,
  type Contact,
  type Pace,
  type VoicemailBehavior,
} from "@/lib/api";
import { CAMPAIGN_TYPES, PERSONAS, VOICES } from "@/lib/personas";

type Step = "brief" | "audience" | "launch";

const SAMPLE_BRIEF = `I'm selling accounting software to small businesses in the US. Please call the business, confirm you're speaking with someone who handles their books, and ask: (1) whether they currently use any accounting software, (2) which one, (3) what they like and dislike about it, and (4) whether they'd be open to a 15-minute demo next week. Be friendly and don't push if they say no.`;

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brief");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Brief fields
  const [name, setName] = useState("Q2 SMB outreach");
  const [type, setType] = useState<CampaignType>("sales");
  const [brief, setBrief] = useState(SAMPLE_BRIEF);
  const [personaId, setPersonaId] = useState("formal");
  const [voiceId, setVoiceId] = useState("sage");
  const [pace, setPace] = useState<Pace>("natural");

  // Audience
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Launch
  const [voicemail, setVoicemail] = useState<VoicemailBehavior>("leave");
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [savedCampaign, setSavedCampaign] = useState<Campaign | null>(null);
  const [attestOpen, setAttestOpen] = useState(false);

  // Load contacts when we enter the audience step (or earlier — we need the tag list).
  useEffect(() => {
    if (step !== "audience" || contacts.length > 0) return;
    (async () => {
      setContactsLoading(true);
      try {
        const res = await listContacts();
        setContacts(res.items);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setContactsLoading(false);
      }
    })();
  }, [step, contacts.length]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of contacts) {
      if (c.dnc) continue;
      for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [contacts]);

  const audienceCount = useMemo(() => {
    if (selectedTags.size === 0) return contacts.filter((c) => !c.dnc).length;
    return contacts.filter((c) => !c.dnc && c.tags.some((t) => selectedTags.has(t))).length;
  }, [contacts, selectedTags]);

  function toggleTag(t: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  // Persist current state — either creates a new campaign or patches the existing.
  async function persist(): Promise<Campaign> {
    setError("");
    const payload = {
      name,
      type,
      brief,
      persona: personaId,
      voice: voiceId,
      pace,
      voicemail,
      audienceTags: Array.from(selectedTags),
      schedule: {
        mode: scheduleMode,
        scheduledAt: scheduleMode === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      },
    };
    if (savedCampaign) {
      const updated = await patchCampaign(savedCampaign.id, payload);
      setSavedCampaign(updated);
      return updated;
    }
    const created = await createCampaign(payload);
    setSavedCampaign(created);
    return created;
  }

  async function goNext(nextStep: Step) {
    setSaving(true);
    try {
      await persist();
      setStep(nextStep);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function launch() {
    // PRD §6.6 — require attestation before launch. Re-prompt every 30 days.
    const prior = loadAttestation();
    const fresh =
      prior &&
      Date.now() - new Date(prior.acknowledgedAt).getTime() < 30 * 24 * 60 * 60 * 1000;
    if (!fresh) {
      setAttestOpen(true);
      return;
    }
    await doLaunch();
  }

  async function doLaunch() {
    setSaving(true);
    setError("");
    try {
      const c = await persist();
      const launched = await launchCampaign(c.id);
      router.push(`/campaigns/${launched.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 1080 }}>
        <Link
          href="/campaigns"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          ← Back to campaigns
        </Link>

        <Eyebrow>New campaign · step {step === "brief" ? 1 : step === "audience" ? 2 : 3} of 3</Eyebrow>
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
          {step === "brief" && "What should we call about?"}
          {step === "audience" && "Who should we call?"}
          {step === "launch" && "Last check, then we dial."}
        </h1>

        <StepRail current={step} onStep={(s) => savedCampaign && setStep(s)} disabled={!savedCampaign} />

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          {step === "brief" && (
            <BriefStep
              {...{ name, setName, type, setType, brief, setBrief, personaId, setPersonaId, voiceId, setVoiceId, pace, setPace }}
            />
          )}
          {step === "audience" && (
            <AudienceStep
              loading={contactsLoading}
              allTags={allTags}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              audienceCount={audienceCount}
              totalContacts={contacts.length}
            />
          )}
          {step === "launch" && (
            <LaunchStep
              {...{
                name,
                type,
                personaId,
                voiceId,
                pace,
                voicemail,
                setVoicemail,
                scheduleMode,
                setScheduleMode,
                scheduledAt,
                setScheduledAt,
                audienceCount,
              }}
            />
          )}
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {savedCampaign ? `Draft saved · ${savedCampaign.id.slice(0, 8)}` : "Not saved yet"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {step === "audience" && (
              <Button variant="ghost" size="md" onClick={() => setStep("brief")}>
                Back
              </Button>
            )}
            {step === "launch" && (
              <Button variant="ghost" size="md" onClick={() => setStep("audience")}>
                Back
              </Button>
            )}
            {step === "brief" && (
              <Button
                variant="accent"
                size="md"
                onClick={() => goNext("audience")}
                disabled={saving || !name.trim() || !brief.trim()}
              >
                {saving ? "Saving…" : "Next: audience"}
              </Button>
            )}
            {step === "audience" && (
              <Button
                variant="accent"
                size="md"
                onClick={() => goNext("launch")}
                disabled={saving || audienceCount === 0}
              >
                {saving ? "Saving…" : `Next: launch · ${audienceCount} contacts`}
              </Button>
            )}
            {step === "launch" && (
              <Button
                variant="accent"
                size="md"
                onClick={launch}
                disabled={saving || audienceCount === 0}
                icon={<Icon name="phone" size={13} color="#fff" />}
              >
                {saving ? "Launching…" : `Launch · ${audienceCount} calls`}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AttestModal
        open={attestOpen}
        onClose={() => setAttestOpen(false)}
        onAttest={() => {
          setAttestOpen(false);
          void doLaunch();
        }}
      />
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Step rail
 * ──────────────────────────────────────────────────────────────────── */
function StepRail({ current, onStep, disabled }: { current: Step; onStep: (s: Step) => void; disabled?: boolean }) {
  const steps: { id: Step; label: string }[] = [
    { id: "brief", label: "Brief" },
    { id: "audience", label: "Audience" },
    { id: "launch", label: "Launch" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {steps.map((s, i) => {
        const active = s.id === current;
        const done = i < currentIdx;
        return (
          <button
            key={s.id}
            onClick={() => !disabled && onStep(s.id)}
            disabled={disabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--paper)" : done ? "var(--ink)" : "var(--ink-3)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: disabled ? "default" : "pointer",
            }}
          >
            <span style={{ opacity: 0.7 }}>0{i + 1}</span>
            {s.label}
            {done && <Icon name="check" size={11} color="var(--sage)" />}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Brief
 * ──────────────────────────────────────────────────────────────────── */
type BriefProps = {
  name: string;
  setName: (v: string) => void;
  type: CampaignType;
  setType: (v: CampaignType) => void;
  brief: string;
  setBrief: (v: string) => void;
  personaId: string;
  setPersonaId: (v: string) => void;
  voiceId: string;
  setVoiceId: (v: string) => void;
  pace: Pace;
  setPace: (v: Pace) => void;
};

function BriefStep(p: BriefProps) {
  const persona = PERSONAS.find((x) => x.id === p.personaId);
  const voice = VOICES.find((x) => x.id === p.voiceId);
  const totalUplift = (persona?.uplift ?? 0) + (voice?.uplift ?? 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 22 }}>
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <FieldLabel>Campaign name</FieldLabel>
        <input
          type="text"
          value={p.name}
          onChange={(e) => p.setName(e.target.value)}
          style={textInput}
        />

        <FieldLabel>Type</FieldLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {CAMPAIGN_TYPES.map((t) => {
            const active = p.type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => p.setType(t.id)}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                  background: active ? "var(--paper)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>{t.label}</div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>{t.blurb}</div>
              </button>
            );
          })}
        </div>

        <FieldLabel>Brief — describe the call in plain language</FieldLabel>
        <textarea
          value={p.brief}
          onChange={(e) => p.setBrief(e.target.value)}
          rows={9}
          style={{
            ...textInput,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 15,
            lineHeight: 1.55,
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <FieldLabel>Persona</FieldLabel>
        <select value={p.personaId} onChange={(e) => p.setPersonaId(e.target.value)} style={textInput}>
          {PERSONAS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label} {x.tier === "premium" ? `(premium · +$${x.uplift.toFixed(2)}/min)` : ""}
            </option>
          ))}
        </select>
        {persona && (
          <p style={{ marginTop: 6, marginBottom: 16, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
            {persona.blurb}
          </p>
        )}

        <FieldLabel>Voice</FieldLabel>
        <select value={p.voiceId} onChange={(e) => p.setVoiceId(e.target.value)} style={textInput}>
          {VOICES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} · {x.tags} {x.tier === "premium" ? `(+$${x.uplift.toFixed(2)}/min)` : ""}
            </option>
          ))}
        </select>
        {voice && (
          <p style={{ marginTop: 6, marginBottom: 16, fontSize: 12, color: "var(--ink-3)" }}>
            {voice.provider}
          </p>
        )}

        <FieldLabel>Speaking pace</FieldLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["slow", "natural", "fast"] as const).map((opt) => {
            const active = p.pace === opt;
            return (
              <button
                key={opt}
                onClick={() => p.setPace(opt)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--paper)" : "var(--ink-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {totalUplift > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            Premium tier · +${totalUplift.toFixed(2)}/min over base rate
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Audience
 * ──────────────────────────────────────────────────────────────────── */
function AudienceStep({
  loading,
  allTags,
  selectedTags,
  toggleTag,
  audienceCount,
  totalContacts,
}: {
  loading: boolean;
  allTags: [string, number][];
  selectedTags: Set<string>;
  toggleTag: (t: string) => void;
  audienceCount: number;
  totalContacts: number;
}) {
  if (loading) {
    return <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading contacts…</div>;
  }
  if (totalContacts === 0) {
    return (
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: 14,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14 }}>
          No contacts in this workspace yet.
        </p>
        <Link href="/contacts/import" style={{ textDecoration: "none" }}>
          <Button variant="accent" size="md" style={{ marginTop: 16 }} icon={<Icon name="upload" size={12} color="#fff" />}>
            Import a CSV
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr", gap: 22 }}>
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <FieldLabel>Filter by tag — leave empty to include everyone (DNC always excluded)</FieldLabel>
        {allTags.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>
            None of your contacts have tags yet — all {totalContacts} will be called.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allTags.map(([t, count]) => {
              const active = selectedTags.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent-2)" : "var(--ink-2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {t}
                  <span style={{ color: active ? "var(--accent)" : "var(--ink-3)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          borderRadius: 14,
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Eyebrow color="var(--accent)" dot>Audience</Eyebrow>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 48,
            color: "var(--accent)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {audienceCount}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
          of {totalContacts} contacts will be dialed
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Launch
 * ──────────────────────────────────────────────────────────────────── */
function LaunchStep({
  name,
  type,
  personaId,
  voiceId,
  pace,
  voicemail,
  setVoicemail,
  scheduleMode,
  setScheduleMode,
  scheduledAt,
  setScheduledAt,
  audienceCount,
}: {
  name: string;
  type: CampaignType;
  personaId: string;
  voiceId: string;
  pace: Pace;
  voicemail: VoicemailBehavior;
  setVoicemail: (v: VoicemailBehavior) => void;
  scheduleMode: "now" | "scheduled";
  setScheduleMode: (v: "now" | "scheduled") => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  audienceCount: number;
}) {
  const persona = PERSONAS.find((x) => x.id === personaId);
  const voice = VOICES.find((x) => x.id === voiceId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: "inset 0 0 0 1px var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <FieldLabel>Schedule</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {(["now", "scheduled"] as const).map((m) => {
              const active = scheduleMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setScheduleMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                    background: active ? "var(--paper)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {m === "now" ? "Start now" : "Scheduled"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                    {m === "now" ? "Begins as soon as you launch" : "Pick a time below"}
                  </div>
                </button>
              );
            })}
          </div>
          {scheduleMode === "scheduled" && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ ...textInput, marginTop: 12 }}
            />
          )}
        </div>

        <div>
          <FieldLabel>On voicemail</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {(
              [
                ["leave", "Leave a message", "AI-generated, ~18 seconds"],
                ["hangup", "Hang up", "Don't leave anything"],
                ["retry", "Retry later", "Try the next attempt window"],
              ] as const
            ).map(([id, label, sub]) => {
              const active = voicemail === id;
              return (
                <button
                  key={id}
                  onClick={() => setVoicemail(id)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                    background: active ? "var(--paper)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          borderRadius: 14,
          padding: "24px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Eyebrow color="var(--accent)" dot="live">Review</Eyebrow>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, lineHeight: 1.15 }}>
          {name}
        </div>
        <div style={{ height: 1, background: "rgba(255,245,230,0.1)" }} />
        <ReviewRow k="Type" v={type} />
        <ReviewRow k="Persona" v={persona?.label || personaId} />
        <ReviewRow k="Voice" v={voice ? `${voice.name} · ${voice.provider}` : voiceId} />
        <ReviewRow k="Pace" v={pace} />
        <ReviewRow k="Voicemail" v={voicemail} />
        <ReviewRow k="Schedule" v={scheduleMode === "now" ? "Start now" : scheduledAt || "—"} />
        <div style={{ height: 1, background: "rgba(255,245,230,0.1)", marginTop: 4 }} />
        <ReviewRow k="Audience" v={`${audienceCount} contacts`} accent />
        <div
          style={{
            marginTop: 6,
            padding: "10px 12px",
            background: "rgba(255,245,230,0.04)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink-4)",
            lineHeight: 1.5,
          }}
        >
          Heads-up: actual dialing is not wired up yet (voice-AI provider
          spike still pending). Launching now just flips the campaign to
          <Tag tone="amber" mono={false}>Scheduled</Tag>.
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 10.5 }}>
        {k}
      </span>
      <span style={{ color: accent ? "var(--accent)" : "var(--paper)" }}>{v}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Shared inputs
 * ──────────────────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 6,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

const textInput: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  marginBottom: 16,
  borderRadius: 8,
  border: "1px solid var(--border-2)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: 14,
  outline: "none",
};
