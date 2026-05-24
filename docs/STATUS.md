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

## Project rules (durable — don't drift from these)

1. **End-to-end slices.** Every slice ships frontend **and** backend
   together. No half-built features. If a slice doesn't have a real
   backend (e.g. the landing page), it's still considered end-to-end
   because there's nothing dynamic to wire up.
2. **AWS for all deploys.** `web/` (Next.js) → AWS Amplify Hosting.
   Backend → AWS Lambda + API Gateway + DynamoDB + S3, region
   `eu-west-2`. No Vercel, no third-party PaaS for the product.
3. **Backend in Python.** FastAPI on Lambda (via AWS SAM or CDK) is
   the default. No Next.js API routes for product logic — anything
   dynamic goes through a Python Lambda.
4. **Match hafiz.in conventions.** Read live in this sandbox (cloned
   2026-05-24 via `GITHUB_TOKEN`). Concrete patterns we copy:
   - **Backend.** Python FastAPI on Lambda via AWS Lambda Web
     Adapter, packaged as a container image. `server/` at the repo
     root, with `server/app/main.py` (FastAPI entry), `server/app/auth.py`
     (Cognito ID-token verifier using `PyJWKClient`, exported as a
     typed dependency `CognitoUser = Annotated[dict, Depends(...)]`),
     `server/app/routes/<resource>.py` per route module.
     `requirements.txt` + `Dockerfile` next to `app/`.
   - **Function URL** with `AuthType: NONE` + JWT verified inside the
     function (no API Gateway for v1 — Function URL is simpler and
     supports response-streaming when we need SSE later).
   - **Frontend auth.** `lib/cognito.ts` lazy-loads
     `amazon-cognito-identity-js@6` + `aws-sdk@2` from a CDN on first
     use (so anonymous landing-page visitors never download them).
     Exports `signUp`, `confirmSignUp`, `signIn`, `signOut`,
     `forgotPassword`, `confirmNewPassword`, `currentSession`,
     `getIdToken`. `lib/loadScript.ts` is the lazy-loader helper.
   - **Infra.** `template.yaml` (SAM) + `samconfig.toml` at repo root,
     region `eu-west-2`. `amplify.yml` build spec. `infra/bootstrap.yaml`
     for the GitHub Actions deployer role (OIDC, repo+branch scoped,
     AdministratorAccess for v1, scope down later).
     `.github/workflows/deploy-server.yml` deploys on push to `main`
     touching `server/**`, `template.yaml`, or `samconfig.toml`.
   - **Conventions to keep.** Pre-create LogGroups with retention
     (Lambda auto-creates never-expire by default). KMS-encrypted S3
     with `DenyInsecureTransport` bucket policy. Pin model/env IDs in
     `samconfig.toml` `parameter_overrides` (CFN ignores template
     `Default:` changes once a stack has resolved a param).
   - **Differences for anycaller.**
     - **New Cognito user pool** (`anycaller-users`) — the PRD already
       calls this out: hafiz.in's pool is single-user, anycaller is
       multi-tenant per workspace.
     - **DynamoDB single-table** (`anycaller-data`) — hafiz.in uses
       per-tool tables, anycaller uses one table with composite keys
       (PRD §7).
     - **No Identity Pool.** hafiz.in uses one to give the browser
       direct DDB access. anycaller routes everything through the
       Lambda, so we skip it.
     - **No Playwright/Chromium** in the Dockerfile — we don't need
       headless browsing on this stack (yet).
     - **Auth as full pages**, not a modal. anycaller is auth-first
       (the SaaS), not anonymous-with-tools (hafiz.in).

## Stage

**First app code shipped.** `web/` is a Next.js 16 App Router app
with the landing page live (no backend yet, but the landing page is
static so this is still rule-1-compliant). The next concrete pieces of
work, in rough order:
1. **Deploy `web/` to AWS Amplify Hosting** for a public URL. User
   does this from their machine since deploy auth isn't in this
   sandbox. `web/` is deploy-ready as a static frontend (no SSR
   dependencies on backend yet).
2. ~~Auth + workspace skeleton~~ — **done** (commit `9d2e120`).
3. ~~Contacts CSV import~~ — **done** (commit `78bac36`).
4. ~~Campaign builder wizard~~ — **done** (commits `594c93b`, `dbe4662`,
   `054a183`).
5. **Tech spike on voice-AI provider** (PRD §8 open question #1) —
   Python worker that bridges Twilio media to OpenAI Realtime *and* to
   Retell, places a 60-sec test call, compares latency/cost/dev
   ergonomics. Output: `docs/decisions/voice-ai-provider.md`. Blocked
   on user providing Twilio + OpenAI/Retell credentials.
6. **Live feed + Call detail** — port `designs/app-screens-run.jsx`.
   Reads call rows from DDB; the actual call orchestration lights up
   once the voice-AI spike concludes.

## What's done

| Commit | What | Status |
|---|---|---|
| `81ce489` | Initial commit — PRD, README, and HTML/CSS mockups | merged on `main` |
| `1074a30` | PRD §6.8 — campaign insights & recommendations (voice/pace/schedule suggestions from past campaign performance, Phase 2) | merged on `main` |
| `7c7992c` | Designs replaced with Claude Design export v1 — `any/call` React+Babel prototype (brand + interactive prototype + hero moments + tweaks panel) | merged on `main` |
| `fa57dd8` | Claude Design export v2 — adds home/landing page (`designs/app-screens-home.jsx`) | merged on `main` |
| `1cf4916` | **First app code** — `web/` Next.js 16 app, design tokens ported, landing page shipped (port of `designs/app-screens-home.jsx`) | merged on `main` |
| `9d2e120` | **Auth slice end-to-end** — SAM template (Cognito + DDB + Function URL + Lambda), Python FastAPI backend (`/healthz`, `/workspaces/me`), Next.js `/login` + `/signup` + `/dashboard` pages. Mirrors hafiz.in conventions. | merged on `main` |
| `78bac36` | **Contacts slice end-to-end** — Python `/contacts` routes (list, create, bulk, patch, delete) with E.164 normalization + dedupe; Next.js `/contacts` list, `/contacts/new` manual add, `/contacts/import` CSV upload + column mapping + preview. AppShell sidebar. | merged on `main` |
| `594c93b`, `dbe4662`, `054a183` | **Campaigns slice end-to-end** — Python `/campaigns` routes (CRUD + `/launch`) with audience snapshot from contact tags; Next.js `/campaigns` list and `/campaigns/new` 3-step wizard (Brief → Audience → Launch) with persona/voice/pace, schedule, review card. Launch flips draft → scheduled (dialing pending voice-AI spike). | merged on `main` |

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
