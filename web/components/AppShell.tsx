"use client";

/* anycaller — sidebar shell. Matches designs/app.jsx Sidebar pixel-for-pixel:
 * wordmark, "+ New call campaign" CTA, NOW / LIBRARY / ACCOUNT sections,
 * live-pulse + counts, credits card. Dashboard and Settings are still
 * routes but reached via the footer; the design doesn't surface them
 * in the primary nav. */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon, Wordmark } from "@/components/ui";
import { currentSession, signOut } from "@/lib/cognito";
import { listBriefs, listCalls, listCampaigns, listContacts, type Campaign } from "@/lib/api";

interface Counts {
  live: number;          // currently-live calls across all campaigns
  campaigns: number;     // total campaigns
  briefs: number;        // saved brief templates
  contacts: number;      // contacts in workspace
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState<Counts>({ live: 0, campaigns: 0, briefs: 0, contacts: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
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

  // Load sidebar counts once authed. Errors are swallowed — sidebar
  // numbers are decorative; the page-level loaders surface real errors.
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const [cs, bs, cts, calls] = await Promise.all([
          listCampaigns(),
          listBriefs(),
          listContacts(),
          listCalls(),
        ]);
        setCampaigns(cs.items);
        setCounts({
          live: calls.items.filter((c) => c.status === "live").length,
          campaigns: cs.items.length,
          briefs: bs.items.length,
          contacts: cts.items.length,
        });
      } catch {
        /* ignore — page handles errors */
      }
    })();
  }, [ready, pathname]);

  const goToLiveFeed = useCallback(() => {
    // Live feed routes to the most recently-touched active campaign.
    // Fallback: /campaigns list.
    const active =
      campaigns.find((c) => c.status === "running") ||
      campaigns.find((c) => c.status === "scheduled") ||
      campaigns.find((c) => c.status === "paused") ||
      campaigns[0];
    if (active) router.push(`/campaigns/${active.id}`);
    else router.push("/campaigns");
  }, [campaigns, router]);

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

  const liveFeedActive = /^\/campaigns\/[^/]+$/.test(pathname) || pathname === "/calls" || pathname.startsWith("/calls/");
  const campaignsActive = pathname === "/campaigns" || pathname === "/campaigns/new";
  const briefsActive = pathname.startsWith("/briefs");
  const contactsActive = pathname.startsWith("/contacts");
  const numbersActive = pathname.startsWith("/numbers");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <aside
        style={{
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--paper-2)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 14px",
        }}
      >
        <div style={{ padding: "4px 8px 18px" }}>
          <Wordmark size={17} live />
        </div>

        <Link
          href="/campaigns/new"
          style={{
            margin: "4px 4px 14px",
            padding: "9px 12px",
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="plus" size={13} color="var(--paper)" />
            New call campaign
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--paper-3)", opacity: 0.7 }}>⌘N</span>
        </Link>

        <div style={{ marginTop: 8 }}>
          <SidebarLabel>Now</SidebarLabel>
          <NavButton
            icon="feed"
            label="Live feed"
            active={liveFeedActive}
            count={counts.live}
            live
            onClick={goToLiveFeed}
          />
          <NavLink icon="dial" label="Campaigns" badge={counts.campaigns || undefined} active={campaignsActive} href="/campaigns" />
        </div>

        <div style={{ marginTop: 14 }}>
          <SidebarLabel>Library</SidebarLabel>
          <NavLink icon="brief" label="Briefs" badge={counts.briefs || undefined} active={briefsActive} href="/briefs" />
          <NavLink icon="list" label="Contacts" badge={counts.contacts || undefined} active={contactsActive} href="/contacts" />
          <NavLink icon="gear" label="Numbers & voices" active={numbersActive} href="/numbers" />
        </div>

        <div style={{ marginTop: "auto" }}>
          <SidebarLabel>Account</SidebarLabel>
          <Link
            href="/settings"
            style={{
              display: "block",
              padding: "10px 12px",
              background: "var(--paper)",
              borderRadius: 8,
              fontSize: 12,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span
                style={{
                  color: "var(--ink-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Credits
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)" }}>10m free</span>
            </div>
            <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "var(--accent)" }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-3)" }}>
              Top up · auto-recharge off
            </div>
          </Link>

          <div
            style={{
              marginTop: 10,
              padding: "0 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--ink-3)",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {email}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-3)",
                fontFamily: "inherit",
                fontSize: "inherit",
                cursor: "pointer",
                padding: "2px 4px",
              }}
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <section style={{ minWidth: 0, overflow: "auto" }}>{children}</section>
    </div>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "4px 12px 6px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
      }}
    >
      {children}
    </div>
  );
}

function NavLink({
  icon,
  label,
  active,
  badge,
  href,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number | string;
  href: string;
}) {
  return (
    <Link href={href} style={navItemStyle(active)}>
      <Icon name={icon} size={14} color={active ? "var(--ink)" : "var(--ink-2)"} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span
          style={{
            padding: "1px 6px",
            borderRadius: 999,
            background: "var(--paper-3)",
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavButton({
  icon,
  label,
  active,
  count,
  live,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  count?: number;
  live?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{ ...navItemStyle(active), border: "none", cursor: "pointer", textAlign: "left" }}>
      <Icon name={icon} size={14} color={active ? "var(--ink)" : "var(--ink-2)"} />
      <span style={{ flex: 1 }}>{label}</span>
      {live && (count ?? 0) > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--accent)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "ac-blink 1.4s infinite",
            }}
          />
          {count}
        </span>
      )}
    </button>
  );
}

function navItemStyle(active?: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "7px 12px",
    margin: "1px 0",
    borderRadius: 7,
    background: active ? "var(--paper)" : "transparent",
    color: active ? "var(--ink)" : "var(--ink-2)",
    fontFamily: "var(--font-ui)",
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    boxShadow: active ? "0 1px 0 var(--border), inset 0 0 0 1px var(--border)" : "none",
    textDecoration: "none",
  };
}
