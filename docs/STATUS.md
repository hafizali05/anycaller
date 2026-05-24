# anycaller — current status & handoff

> Live state of the **anycaller** project. The `PRD.md` at the repo root is
> the product spec — read it first. This doc is the bridge between sessions:
> what's done, what's next, what decisions are outstanding, and what each
> environment can/can't do. **Update this file as work progresses.**

**Last updated:** 2026-05-24

## TL;DR for a fresh session

1. Read `PRD.md` at the repo root (~330 lines — the full product spec).
2. Open `designs/index.html` in a browser to see the visual prototype
   (single-page React+Babel-in-browser canvas; left rail toggles between
   Brand system, Prototype, and Hero moments; top-right ⚙ opens the
   tweaks panel for theme / accent / density).
3. Read this file — current state, decisions, prerequisites.
4. If a `docs/plans/<slice>.md` exists, that's the active implementation
   slice. Otherwise, ask which slice to plan next.

**Stage:** First app code shipped. `web/` is a Next.js 16 App Router app
with the landing page live (no backend yet). The next concrete pieces of
work, in rough order:
1. **Deploy `web/`** to Vercel (or Amplify) for a public URL — the
   user does this from their machine since deploy auth isn't in this
   sandbox. `web/` is deploy-ready as a static frontend.
2. **App shell + Live feed** — port the sidebar + the in-app Live feed
   screen from `designs/app-screens-run.jsx` so the product surface
   exists, still on mocked data, no backend.
3. **Tech spike on voice-AI provider** (still PRD §8 open question #1).
4. **Auth + workspace skeleton** (Cognito), then Contacts → Campaign
   builder, per the original slice list below.

## What's done

| Commit | What | Status |
|---|---|---|
| `81ce489` | Initial commit — PRD, README, and HTML/CSS mockups | merged on `main` |
| `1074a30` | PRD §6.8 — campaign insights & recommendations (voice/pace/schedule suggestions from past campaign performance, Phase 2) | merged on `main` |
| `7c7992c` | Designs replaced with Claude Design export v1 — `any/call` React+Babel prototype (brand + interactive prototype + hero moments + tweaks panel) | merged on `main` |
| `fa57dd8` | Claude Design export v2 — adds home/landing page (`designs/app-screens-home.jsx`) | merged on `main` |
| `1cf4916` | **First app code** — `web/` Next.js 16 app, design tokens ported, landing page shipped (port of `designs/app-screens-home.jsx`) | merged on `main` |

Files in the repo today:
- `PRD.md` — Product Requirements Document, v0.1 draft. 11 sections from
  problem statement through success metrics and glossary. Authoritative for
  scope.
- `README.md` — short orientation; points at PRD as the source of truth.
- `designs/` — `any/call` design prototype exported from Claude Design
  (claude.ai/design). React + Babel-in-browser, no build step — open
  `designs/index.html` directly. Files:
  - `index.html` — entry point; loads React + Babel CDN and the `.jsx` files below.
  - `tokens.css` — design tokens (warm-paper palette, vermillion live
    accent, sage resolved, Geist + Geist Mono + Newsreader italic type,
    density and theme variants).
  - `design-canvas.jsx` — top-level canvas with three sections: **Brand
    & system** (wordmark, palette, type, motion, call states),
    **Prototype** (the interactive app — see below), **Hero moments**
    (Brief→agent generation, live-call waveform, result extraction,
    rehearsal, first-run empty state).
  - `app-screens-home.jsx` — marketing/landing page (nav, hero
    composer + live-call card, magic-moment brief→agent, "what you get
    back", use cases, how it works, live ribbon, trust, pricing, CTA,
    footer).
  - `app.jsx`, `app-canvas.jsx`, `app-components.jsx`, `app-data.jsx`,
    `app-screens-create.jsx`, `app-screens-run.jsx`,
    `app-screens-library.jsx` — the prototype: 6-route app with Live
    feed, New-campaign wizard (Brief → Contacts → Launch), Call detail
    (transcript + recording + extracted fields), Rehearsal, Briefs
    library, Contacts library, Campaigns list.
  - `tweaks-panel.jsx` — top-right toolbar: theme (sepia / cream /
    dark), accent color, density.
  Brand: rebranded as **`any/call`** (the slash reads as a dialer
  separator; the `●` beside it doubles as a live/record light). The
  PRD's project name is still `anycaller` — that's a decision to confirm
  before going further. There is no home/marketing page in the
  prototype (Claude Design chat 2 started one but didn't finish).
- `docs/STATUS.md` — this file.
- `web/` — Next.js 16 App Router project. Landing page (`app/page.tsx`)
  ported from `designs/app-screens-home.jsx`. Design tokens in
  `app/globals.css`. Shared UI primitives in `components/ui.tsx`
  (Wordmark, Waveform, StaticWaveform, Button, Icon, Tag, StatusPill,
  StreamText, SectionLabel, Eyebrow, Display, HomeRule). Run
  `cd web && npm run dev` to start it on `localhost:3000`. No backend,
  no data fetching — everything is hardcoded/mocked.

No backend yet, no AWS resources, no Twilio account, no voice-AI
integration. The product surface is one marketing page; the rest of
the prototype is still HTML/JSX in `designs/`.

## Open decisions (from PRD §8 — resolve before / during MVP work)

These are the load-bearing choices that will shape implementation. None
should be made in passing — flag them when proposing related work, and
record the resolution as a new `docs/decisions/<topic>.md` when made.

1. **Voice-AI provider** — OpenAI Realtime (most flexible) vs Retell or Vapi
   (managed telephony+AI integration). Tech spike required before
   committing. Influences ~30% of the call-worker architecture.
2. **Database** — DynamoDB single-table vs Aurora Postgres. PRD favours
   DynamoDB for write throughput during large campaigns; Aurora makes
   ad-hoc analytics easier. Decision affects schema design from day one.
3. **Launch verticals** — PRD currently lists Sales + Survey + Recruitment
   as MVP campaign types; §8 recommends launching with **Sales + Survey**
   first and adding Recruitment in v1.1. Confirm before campaign-builder
   work begins.
4. **Inbound number** — voicemail-only inbound in v1 (yes / no / defer).
5. **Pricing model** — pure usage ($0.20/connected-minute + $0.05/attempt)
   vs subscription tier with included minutes. Decision needed before
   Stripe integration.
6. **Brand & name** — `anycaller` is a placeholder. Won't block engineering
   but blocks domain purchase, Twilio number provisioning, and any
   marketing.

## Prerequisites only the user can do

These are the external accounts and approvals nothing in this repo can
self-serve. They're blockers for the relevant slices, not for planning.

1. **Twilio account** + paid plan + at least one provisioned outbound
   number (UK + US ideally). Required before any real call can be placed.
   STIR/SHAKEN attestation setup is part of this.
2. **OpenAI organisation with Realtime API access** *(if Realtime is the
   chosen provider)* OR **Retell / Vapi account** *(if managed)*. Decision
   pending tech spike.
3. **Stripe account** in live mode + tax setup. Required before paid users
   can sign up.
4. **AWS deploy credentials** for whichever session runs `sam deploy` /
   `cdk deploy` once backend work begins. Same shape as the hafiz.in
   workflow — create an IAM user `anycaller-deployer` with scoped
   permissions (CloudFormation, Lambda, DynamoDB, S3, Cognito, IAM
   PassRole) and put the keys in `~/.aws/credentials` on the machine
   that deploys, or as session secrets in the desktop app.
5. **Legal review** of the calling-consent / disclosure flow before any
   production traffic. Cheap version: a templated DPA + the operator
   self-certify checkbox flow described in PRD §6.6. Proper version: a
   lawyer in each launch jurisdiction.

## Implementation slices — proposed ordering

When you're ready to start building, these are the natural slices in
roughly the order that de-risks the project fastest. Each becomes its own
`docs/plans/<slice>.md` once you say "let's plan this one." Don't start
implementing without a written plan for the slice.

1. **Tech spike: voice-AI provider** *(decision-driving)*. Build a tiny
   end-to-end prototype: dial a number via Twilio, bridge to OpenAI
   Realtime *and* to Retell, place a 60-second test call to a personal
   phone with a fixed script, compare latency / naturalness / dev
   ergonomics / cost. Output: a `docs/decisions/voice-ai-provider.md`.
2. **Auth + workspace skeleton** *(unblocks everything else)*. Cognito user
   pool, Amplify-hosted Next.js shell, login / signup, workspace row in
   DDB. Reuses the hafiz.in patterns directly.
3. **Contacts: CSV import + DDB schema**. Operator can upload contacts and
   see them listed. No campaigns yet. Decision item: confirms DDB
   single-table model.
4. **Campaign builder: wizard for one type only (Survey)**. Saves a
   campaign row; no execution. Validates the data model end-to-end.
5. **Call orchestrator + worker (Fargate or Lambda)** + Twilio integration
   + voice agent. Can execute a single call against the script. The
   biggest engineering chunk.
6. **Campaign monitor (live dashboard)**. WebSocket / SSE feed of campaign
   events.
7. **Call detail page** + audio playback + structured extraction.
8. **Stripe billing + credits**.
9. **Sales + Custom campaign types** (PRD says Sales is co-MVP with Survey
   — fold in once the Survey path works end-to-end).
10. **Compliance polish**: DNC list ingestion, opt-out detection, calling
    hours enforcement, audit logs.
11. **Launch readiness**: legal review, observability, runbooks, support.

## Resource reference

- **GitHub repo:** `github.com/hafizali05/anycaller` (private; SSH remote)
- **Live URL:** TBD (no deploys yet)
- **AWS region:** `eu-west-2` (London) — matches hafiz.in primary region
- **Frontend stack:** Next.js 16 App Router (matches hafiz.in)
- **Auth:** Cognito (pool TBD — new pool for this project, not reusing the
  `eu-west-2_pFxTvhYdw` hafiz.in pool, because workspaces here are
  multi-tenant and the existing pool is single-user)
- **DB:** DynamoDB single-table proposed (decision open)
- **Storage:** S3 (recordings + uploaded CSVs) — bucket TBD
- **Telephony:** Twilio — account TBD
- **Voice AI:** OpenAI Realtime / Retell / Vapi — provider TBD
- **Billing:** Stripe — account TBD

## Cross-session workflow

`anycaller` follows the same docs-in-repo handoff pattern established for
[the hafiz.in Job Apply project](../../hafiz.in/docs/job-apply/STATUS.md)
(see `feedback_plans-status-in-repo` memory): plan and live status live in
this repo, not in `~/.claude/plans/`, so any session — local CLI on the
VPS, or Claude Code desktop's cloud sandbox attached to this repo — can
pick up cleanly.

| Environment | What it can do |
|---|---|
| Local CLI (any machine with the repo cloned) | Everything: design, write code, deploy to AWS (with creds), Twilio setup, push commits. |
| Claude Code desktop cloud sandbox attached to this repo | Code + planning + AWS deploy (with creds in session secrets) + push commits. Cannot ssh to a VPS or use local browser. |
| VPS Claude Code session | Same as local CLI. No special role for this project (anycaller has no VPS dependency). |

Branches: stay on `main` until there's a need for parallel work. Push and
pull frequently when working from multiple sessions.

## Out-of-scope reminders

These are explicit boundaries from the PRD (don't quietly add them later):

- **Inbound calls** beyond voicemail-only — deferred to phase 3.
- **Email / SMS campaigns** — phase 2.
- **Live human transfer** — every call is fully AI-handled in MVP.
- **Multi-language** — English only at launch.
- **Multi-user workspaces** — one account = one workspace at MVP.
- **Native CRM integrations** — CSV export only; Zapier/HubSpot/SF in
  phase 2+.
