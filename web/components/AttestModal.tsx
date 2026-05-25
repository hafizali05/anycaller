"use client";

/* Compliance attestation modal. PRD §6.6: operator must self-certify
 * a valid calling basis (consent / existing relationship / regulated
 * exception) before launch. Captured once and stored in localStorage
 * — the durable record lives on the campaign after launch. */

import { Button, Icon } from "@/components/ui";
import { useState } from "react";

const STORAGE_KEY = "anycaller.attest.v1";

export interface AttestRecord {
  basis: string;
  acknowledgedAt: string;
}

export function loadAttestation(): AttestRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttestRecord) : null;
  } catch {
    return null;
  }
}

function saveAttestation(rec: AttestRecord) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

const BASES = [
  { id: "consent", label: "Explicit prior consent", blurb: "Each contact opted in to receive calls about this topic." },
  { id: "ebr",     label: "Existing business relationship", blurb: "Current or recent customer/prospect, within the regulator's window." },
  { id: "b2b",     label: "B2B exception",                  blurb: "Calling business lines about a business matter (TCPA B2B carve-out)." },
  { id: "regulated", label: "Regulated exception",          blurb: "Non-marketing, e.g. appointment reminder, account servicing." },
];

export function AttestModal({
  open,
  onClose,
  onAttest,
}: {
  open: boolean;
  onClose: () => void;
  onAttest: (rec: AttestRecord) => void;
}) {
  const [basis, setBasis] = useState<string>("ebr");
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  function confirm() {
    const rec: AttestRecord = {
      basis,
      acknowledgedAt: new Date().toISOString(),
    };
    saveAttestation(rec);
    onAttest(rec);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,23,20,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--paper)",
          borderRadius: 16,
          padding: "28px 32px",
          boxShadow: "0 32px 80px -32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Before you launch · compliance
            </span>
            <h2
              style={{
                margin: "8px 0 0",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.1,
              }}
            >
              Confirm your calling basis.
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer" }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
          You are responsible for the legal basis on which you call each
          contact. We&rsquo;ll DNC-scrub and enforce calling windows, but you
          must have a lawful basis. Pick the one that applies for this
          campaign:
        </p>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {BASES.map((b) => {
            const active = basis === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBasis(b.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${active ? "var(--ink)" : "var(--border-2)"}`,
                  background: active ? "var(--paper-2)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 13.5, color: "var(--ink)" }}>{b.label}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>{b.blurb}</div>
              </button>
            );
          })}
        </div>

        <label
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            background: "var(--paper-2)",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.45,
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            I certify that I have a lawful basis to call every contact in this campaign&rsquo;s audience,
            and that I&rsquo;m responsible for any consent records.
          </span>
        </label>

        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            size="md"
            onClick={confirm}
            disabled={!agreed}
            icon={<Icon name="check" size={13} color="#fff" />}
          >
            Acknowledge & continue
          </Button>
        </div>
      </div>
    </div>
  );
}
