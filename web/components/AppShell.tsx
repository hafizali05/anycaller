"use client";

/* anycaller — sidebar shell for authenticated pages.
 * Minimal v0: Dashboard + Contacts links + sign-out. The full
 * design-system sidebar (Live feed / Campaigns / Briefs / etc.)
 * lands in a later slice. */

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Wordmark } from "@/components/ui";
import { currentSession, signOut } from "@/lib/cognito";

interface NavItem {
  href: "/dashboard" | "/contacts" | "/campaigns";
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "feed" },
  { href: "/campaigns", label: "Campaigns", icon: "dial" },
  { href: "/contacts", label: "Contacts", icon: "list" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Dev-only screenshot bypass — `?preview=1` skips Cognito so the
      // sandbox can render pages without a deployed pool. The
      // process.env.NODE_ENV check is statically evaluated at build
      // time, so this block is dead-code-eliminated in production.
      if (
        process.env.NODE_ENV === "development" &&
        typeof window !== "undefined" &&
        window.location.search.includes("preview=1")
      ) {
        setEmail("you@example.com");
        setReady(true);
        return;
      }
      const session = await currentSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setEmail(session.email);
      setReady(true);
    })();
  }, [router]);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "grid", placeItems: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        Loading…
      </main>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "232px 1fr",
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--paper-2)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
        }}
      >
        <div style={{ padding: "0 8px 24px" }}>
          <Wordmark size={18} live />
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontFamily: "var(--font-ui)",
                  fontSize: 13.5,
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  background: active ? "var(--paper-3)" : "transparent",
                  textDecoration: "none",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon name={item.icon} size={15} color={active ? "var(--ink)" : "var(--ink-3)"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              padding: "0 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-3)",
              wordBreak: "break-all",
              marginBottom: 10,
            }}
          >
            {email}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--ink-2)",
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <section style={{ overflow: "auto" }}>{children}</section>
    </div>
  );
}
