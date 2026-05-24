"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { inputStyle } from "@/components/AuthShell";
import { Button, Eyebrow, Icon } from "@/components/ui";
import { createContact } from "@/lib/api";

export default function NewContactPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createContact({
        phone: phone.trim(),
        name: name.trim() || null,
        email: email.trim() || null,
        company: company.trim() || null,
        tags,
      });
      router.push("/contacts");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 520 }}>
        <Link
          href="/contacts"
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
          ← Back to contacts
        </Link>

        <Eyebrow>New contact</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 36,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Add a contact
        </h1>

        <div
          style={{
            background: "var(--paper-2)",
            borderRadius: 14,
            padding: "24px 28px",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <Field label="Phone *">
            <input
              style={inputStyle}
              type="tel"
              placeholder="+1 (415) 555-0142"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Name">
            <input style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Company">
            <input style={inputStyle} type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              style={inputStyle}
              type="text"
              placeholder="q2-outreach, smb"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </Field>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--accent-2)",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button
              variant="accent"
              size="lg"
              onClick={save}
              disabled={saving || !phone.trim()}
              icon={<Icon name="plus" size={13} color="#fff" />}
            >
              {saving ? "Saving…" : "Save contact"}
            </Button>
            <Link href="/contacts" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 6 }}>
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
