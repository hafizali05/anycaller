"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Eyebrow, Icon, Tag } from "@/components/ui";
import { bulkCreateContacts, type BulkResult, type ContactIn } from "@/lib/api";

type ColumnMap = {
  phone: string;
  name: string;
  email: string;
  company: string;
};

const KNOWN_COLUMNS = ["phone", "name", "email", "company"] as const;

function guessColumn(headers: string[], hints: string[]): string {
  for (const hint of hints) {
    const match = headers.find((h) => h.toLowerCase().trim() === hint);
    if (match) return match;
  }
  for (const hint of hints) {
    const match = headers.find((h) => h.toLowerCase().includes(hint));
    if (match) return match;
  }
  return "";
}

const GUESS_HINTS: Record<keyof ColumnMap, string[]> = {
  phone: ["phone", "phonenumber", "phone_number", "mobile", "tel", "number"],
  name: ["name", "full_name", "fullname", "contact"],
  email: ["email", "e-mail", "mail"],
  company: ["company", "organisation", "organization", "org", "business"],
};

export default function ImportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    phone: "",
    name: "",
    email: "",
    company: "",
  });
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState("");

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  );

  function handleFile(file: File | undefined) {
    if (!file) return;
    setParseError("");
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        if (parsed.errors.length) {
          setParseError(parsed.errors.map((e) => e.message).join("; "));
          return;
        }
        const hdrs = parsed.meta.fields || [];
        setHeaders(hdrs);
        setRows(parsed.data);
        setColumnMap({
          phone: guessColumn(hdrs, [...GUESS_HINTS.phone]),
          name: guessColumn(hdrs, [...GUESS_HINTS.name]),
          email: guessColumn(hdrs, [...GUESS_HINTS.email]),
          company: guessColumn(hdrs, [...GUESS_HINTS.company]),
        });
      },
      error: (e) => setParseError(e.message),
    });
  }

  async function submit() {
    if (!rows || !columnMap.phone) return;
    const payload: ContactIn[] = rows.map((r) => {
      const custom: Record<string, string> = {};
      for (const h of headers) {
        if (Object.values(columnMap).includes(h)) continue;
        const v = (r[h] || "").trim();
        if (v) custom[h] = v;
      }
      return {
        phone: (r[columnMap.phone] || "").trim(),
        name: columnMap.name ? (r[columnMap.name] || "").trim() || null : null,
        email: columnMap.email ? (r[columnMap.email] || "").trim() || null : null,
        company: columnMap.company ? (r[columnMap.company] || "").trim() || null : null,
        tags,
        custom,
      };
    });
    setSubmitting(true);
    setError("");
    try {
      setResult(await bulkCreateContacts(payload));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 48px", maxWidth: 920 }}>
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

        <Eyebrow>Import · CSV</Eyebrow>
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
          Import contacts
        </h1>

        {!rows && (
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 14,
              padding: "40px 32px",
              boxShadow: "inset 0 0 0 1px var(--border)",
              textAlign: "center",
            }}
          >
            <label
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <Icon name="upload" size={26} color="var(--ink-3)" />
              <span style={{ fontSize: 15 }}>
                <span style={{ color: "var(--accent)", textDecoration: "underline" }}>Pick a CSV</span>
                <span style={{ color: "var(--ink-3)" }}> · the header row must include a phone column</span>
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </label>
            {parseError && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                }}
              >
                {parseError}
              </div>
            )}
          </div>
        )}

        {rows && !result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "var(--paper-2)",
                borderRadius: 14,
                padding: "24px 28px",
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <Eyebrow>Map columns</Eyebrow>
              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "100px 1fr",
                  rowGap: 12,
                  columnGap: 18,
                  alignItems: "center",
                }}
              >
                {KNOWN_COLUMNS.map((field) => (
                  <ColumnPicker
                    key={field}
                    label={field}
                    required={field === "phone"}
                    value={columnMap[field]}
                    headers={headers}
                    onChange={(v) => setColumnMap((m) => ({ ...m, [field]: v }))}
                  />
                ))}
              </div>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 12.5,
                  color: "var(--ink-3)",
                  lineHeight: 1.5,
                }}
              >
                Columns you don&rsquo;t map here are preserved per contact as
                custom fields. Phone is the only required column.
              </p>
            </div>

            <div
              style={{
                background: "var(--paper-2)",
                borderRadius: 14,
                padding: "24px 28px",
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <Eyebrow>Tags for all imported contacts</Eyebrow>
              <input
                type="text"
                placeholder="e.g. q2-outreach, smb, sales"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-2)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              {tags.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tags.map((t) => (
                    <Tag key={t} tone="accent">
                      {t}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                background: "var(--paper)",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "inset 0 0 0 1px var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Eyebrow>Preview · first 5</Eyebrow>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>
                  {rows.length} rows
                </span>
              </div>
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12.5,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "6px 10px",
                            color: "var(--ink-3)",
                            borderBottom: "1px solid var(--border)",
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        {headers.map((h) => (
                          <td
                            key={h}
                            style={{
                              padding: "6px 10px",
                              color: "var(--ink)",
                              borderBottom: "1px solid var(--border)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button
                variant="accent"
                size="lg"
                onClick={submit}
                disabled={!columnMap.phone || submitting}
                icon={<Icon name="upload" size={13} color="#fff" />}
              >
                {submitting ? "Importing…" : `Import ${rows.length} contacts`}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setRows(null);
                  setHeaders([]);
                  setColumnMap({ phone: "", name: "", email: "", company: "" });
                  setTagsInput("");
                  setParseError("");
                }}
              >
                Pick another file
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 14,
              padding: "28px 32px",
              boxShadow: "inset 0 0 0 1px var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
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
              Done.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <ResultStat label="Created" value={result.created} tone="sage" />
              <ResultStat label="Duplicates skipped" value={result.skippedDuplicate} tone="neutral" />
              <ResultStat label="Invalid" value={result.invalid.length} tone="accent" />
            </div>

            {result.invalid.length > 0 && (
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                  }}
                >
                  Show {result.invalid.length} invalid row{result.invalid.length === 1 ? "" : "s"}
                </summary>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)" }}>
                  {result.invalid.map((r, i) => (
                    <li key={i}>
                      <code>{r.row || "(blank)"}</code> — {r.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="accent" size="md" onClick={() => router.push("/contacts")}>
                View contacts
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setRows(null);
                  setResult(null);
                  setColumnMap({ phone: "", name: "", email: "", company: "" });
                  setTagsInput("");
                }}
              >
                Import another file
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ColumnPicker({
  label,
  required,
  value,
  headers,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  headers: string[];
  onChange: (v: string) => void;
}) {
  return (
    <>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label} {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-2)",
          background: "var(--paper)",
          color: "var(--ink)",
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          outline: "none",
        }}
      >
        <option value="">— none —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: number; tone: "sage" | "accent" | "neutral" }) {
  const colors = {
    sage: "var(--sage)",
    accent: "var(--accent)",
    neutral: "var(--ink-2)",
  };
  return (
    <div
      style={{
        background: "var(--paper)",
        borderRadius: 10,
        padding: "16px 18px",
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
          marginTop: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 32,
          letterSpacing: "-0.02em",
          color: colors[tone],
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
