"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Eyebrow, Wordmark } from "@/components/ui";
import { currentSession, signOut } from "@/lib/cognito";
import { fetchMe, type Me } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await currentSession();
        if (!session) {
          router.replace("/login");
          return;
        }
        const data = await fetchMe();
        setMe(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        padding: "32px 56px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 48,
        }}
      >
        <Wordmark size={20} live />
        <Button variant="ghost" size="md" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      <div style={{ maxWidth: 720 }}>
        <Eyebrow>Dashboard</Eyebrow>
        <h1
          style={{
            margin: "8px 0 24px",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {loading
            ? "Loading…"
            : me
              ? `Welcome to ${me.workspace.name}.`
              : "Welcome."}
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

        {me && (
          <div
            style={{
              background: "var(--paper-2)",
              borderRadius: 14,
              padding: "24px 28px",
              boxShadow: "inset 0 0 0 1px var(--border)",
              display: "grid",
              gridTemplateColumns: "max-content 1fr",
              rowGap: 10,
              columnGap: 24,
              fontSize: 14,
            }}
          >
            <Field label="Email" value={me.email || "—"} />
            <Field label="User sub" value={me.sub} mono />
            <Field label="Workspace" value={me.workspace.name} />
            <Field label="Workspace ID" value={me.workspace.id} mono />
            <Field label="Created" value={me.workspace.createdAt} mono />
          </div>
        )}

        <p
          style={{
            marginTop: 32,
            fontSize: 13.5,
            color: "var(--ink-3)",
            lineHeight: 1.55,
            maxWidth: 540,
          }}
        >
          This is the placeholder dashboard. Next slice will add the sidebar
          and the Live feed screen from <code>designs/app-screens-run.jsx</code>
          on top of this shell.
        </p>
      </div>
    </main>
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
