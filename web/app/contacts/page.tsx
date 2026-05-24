"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";
import {
  deleteContact,
  listContacts,
  patchContact,
  type Contact,
} from "@/lib/api";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await listContacts(q);
      setContacts(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Debounce the search so we don't hammer the API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => void refresh(query), 250);
    return () => clearTimeout(id);
  }, [query, refresh]);

  async function toggleDnc(c: Contact) {
    try {
      const updated = await patchContact(c.id, { dnc: !c.dnc });
      setContacts((cs) => cs.map((x) => (x.id === c.id ? updated : x)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(c: Contact) {
    if (!confirm(`Delete ${c.name || c.phone}?`)) return;
    try {
      await deleteContact(c.id);
      setContacts((cs) => cs.filter((x) => x.id !== c.id));
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
            <Eyebrow>Library · contacts</Eyebrow>
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
              Your contacts
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="search"
              placeholder="Search name, phone, email, company"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-2)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "var(--font-ui)",
                fontSize: 13,
                width: 280,
                outline: "none",
              }}
            />
            <Link href="/contacts/new" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="md" icon={<Icon name="plus" size={12} color="var(--ink)" />}>
                Add
              </Button>
            </Link>
            <Link href="/contacts/import" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="md" icon={<Icon name="upload" size={12} color="var(--paper)" />}>
                Import CSV
              </Button>
            </Link>
          </div>
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
        ) : contacts.length === 0 ? (
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
                gridTemplateColumns: "1.6fr 1.2fr 1.4fr 1.4fr 90px 70px",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              <span>Name</span>
              <span>Phone</span>
              <span>Company</span>
              <span>Tags</span>
              <span>DNC</span>
              <span></span>
            </div>
            {contacts.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1.2fr 1.4fr 1.4fr 90px 70px",
                  padding: "12px 16px",
                  alignItems: "center",
                  fontSize: 13.5,
                  color: "var(--ink)",
                  borderBottom: i === contacts.length - 1 ? "none" : "1px solid var(--border)",
                  background: c.dnc ? "var(--paper-2)" : "transparent",
                  opacity: c.dnc ? 0.7 : 1,
                }}
              >
                <span style={{ fontWeight: 500 }}>{c.name || <em style={{ color: "var(--ink-3)" }}>—</em>}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{c.phone}</span>
                <span style={{ color: "var(--ink-2)" }}>{c.company || ""}</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {c.tags.length === 0 && <span style={{ color: "var(--ink-3)" }}>—</span>}
                  {c.tags.map((t) => (
                    <Tag key={t} tone="outline">
                      {t}
                    </Tag>
                  ))}
                </div>
                <button
                  onClick={() => toggleDnc(c)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--border-2)",
                    background: c.dnc ? "var(--accent-soft)" : "transparent",
                    color: c.dnc ? "var(--accent-2)" : "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                  title={c.dnc ? "Click to remove DNC" : "Click to mark DNC"}
                >
                  {c.dnc ? "DNC" : "—"}
                </button>
                <button
                  onClick={() => remove(c)}
                  aria-label="Delete contact"
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
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
          }}
        >
          {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
        </div>
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
        No contacts yet.
      </h2>
      <p style={{ margin: "10px 0 24px", color: "var(--ink-2)", fontSize: 14 }}>
        Import a CSV with a <code>phone</code> column to get started.
      </p>
      <Link href="/contacts/import" style={{ textDecoration: "none" }}>
        <Button variant="accent" size="lg" icon={<Icon name="upload" size={13} color="#fff" />}>
          Import CSV
        </Button>
      </Link>
    </div>
  );
}
