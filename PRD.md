# anycaller — Product Requirements Document

_Working title. Branding TBD._

**Version**: 0.1 (draft)
**Author**: Hafiz Didarali
**Date**: 2026-05-23
**Status**: Concept

---

## 1. Summary

**anycaller** is a campaign-driven outbound calling platform powered by AI voice agents. An operator uploads a list of contacts, describes the goal of the campaign in plain English (sales pitch, survey, recruitment screen, etc.), and the system places hundreds or thousands of phone calls in parallel — each handled by an AI agent that follows the brief, holds a natural conversation, and returns a structured outcome plus a full transcript.

The MVP focuses on **outbound voice calls only**. Email and SMS campaigns are planned for phase 2.

---

## 2. Problem & opportunity

Outbound phone communication at any meaningful scale is one of the most labour-intensive things a small team can do:

- **Sales/SDR teams** burn 60–80% of their week on dialling, leaving little time for actual selling.
- **Recruiters** spend hours on first-round phone screens that, in 70%+ of cases, end in disqualification.
- **Researchers / NPS teams** struggle to reach statistically meaningful sample sizes because response rates over the phone are 5–15%.
- Each phone call is, by nature, a serial task — one operator can only have one conversation at a time.

Recent advances in low-latency voice-to-voice LLMs (OpenAI Realtime, Retell, Vapi, etc.) make it feasible for an AI agent to hold a fluent phone conversation that a recipient is willing to engage with. The opportunity is to package that capability as a tool where a single operator can launch and supervise thousands of parallel conversations, with structured data returned for every call.

---

## 3. Target users

**Primary (MVP):**

1. **SDR / outbound sales teams** at SaaS or services companies (5–50 person startups). Use case: book demos, qualify leads, re-engage cold lists.
2. **Recruitment agencies & in-house TA teams**. Use case: first-round phone screens, scheduling, candidate re-engagement.
3. **Research / CX teams**. Use case: phone surveys, NPS follow-ups, customer health checks.

**Secondary (later):**

- Non-profits running donor outreach
- Real estate agents qualifying leads
- Political / civic campaigns (with extra compliance care)

---

## 4. Goals & non-goals

### MVP goals

- A single operator can run a 1,000-contact outbound campaign in under 30 minutes of setup time.
- ≥80% of completed calls return useful structured data (vs. silence / failure).
- ≥4/5 average score on a "would you accept this call from a human" rubric (sampled QA).
- Three campaign templates work out of the box: **Survey**, **Recruitment**, **Sales**.
- Operator has a real-time view of the campaign and can stop it instantly.

### Non-goals (MVP)

- **Inbound** calls — outbound only.
- **Email & SMS** campaigns — voice only. Email/SMS deferred to phase 2 but the data model should not preclude them.
- **Multi-language** — English only at launch.
- **Live transfer to a human agent** — every call is fully AI-handled.
- **Native CRM integrations** — CSV export only at MVP; Zapier/HubSpot in phase 2.
- **Multi-user workspaces** — one account = one workspace. Team accounts in phase 2.

---

## 5. Key user flows

### Flow 1 — Import contacts

1. Operator clicks "Import CSV" on the Contacts page.
2. Uploads a `.csv` with at minimum a phone column; optionally name, email, and arbitrary custom columns (e.g. `company`, `role`, `last_purchase`).
3. System validates and normalises phone numbers to E.164, flags invalid rows, deduplicates against existing contacts.
4. Operator maps columns, confirms, contacts are saved with optional tags.

### Flow 2 — Build a campaign

1. Operator clicks "New campaign".
2. **Step 1 — Type**: picks Survey, Recruitment, Sales, or Custom.
3. **Step 2 — Script**: fills in the type-specific brief (see §6.2). A live AI-generated script preview appears alongside.
4. **Step 3 — Voice & behaviour**: picks voice persona, pace, voicemail handling, retry policy, max call duration.
5. **Step 4 — Audience**: selects contact list(s), filters by tag or custom field, automatically excludes DNC.
6. **Step 5 — Schedule**: chooses start time, calling window (local time of recipient), days of week, concurrency cap.
7. **Step 6 — Review**: sees summary, estimated cost, confirms.

### Flow 3 — Monitor a running campaign

1. Operator opens the campaign and sees a live dashboard: counts by status, progress bar, live call feed.
2. Can click any call in progress / completed to see its detail.
3. Can **Pause**, **Resume**, or **Stop** at any time. Stop is a hard kill — in-flight calls finish their current turn and hang up.

### Flow 4 — Review results

1. After campaign completes, operator gets a summary email + in-app notification.
2. Per-call rows show contact, duration, outcome label, AI-extracted fields.
3. Operator can drill into any call: full transcript, audio recording, structured data, can edit the outcome tag, add notes, mark for follow-up.
4. Bulk export to CSV — one row per call, with all extracted fields as columns.

---

## 6. Feature requirements (MVP)

### 6.1 Contact management

| Feature | Requirement |
|---|---|
| CSV import | Drag-and-drop or file picker. Required column: `phone`. Suggested: `name`, `email`. Arbitrary additional columns are preserved as custom fields. |
| Phone validation | E.164 normalisation via libphonenumber. Invalid rows are flagged but not silently dropped. |
| Deduplication | By normalised phone. Duplicates are skipped with a count shown to the user. |
| Tags | Each contact can have multiple tags. Tags used as the primary filter for audience selection. |
| Search | Free-text search on name, phone, email, company. |
| Manual entry | Single-contact add form. |
| Bulk delete | With confirmation. |
| Do-Not-Call (DNC) | A contact can be marked DNC. DNC contacts are excluded from all campaigns automatically. |

### 6.2 Campaign builder

The novel surface area. Campaign type drives which fields appear in step 2.

#### Survey campaign

- Survey title.
- Up to 10 questions, each typed: **Yes/No**, **Scale 1–5**, **Multiple choice** (with options), or **Open text**.
- Intro/exit messages (auto-generated, editable).
- Optional incentive line ("Thanks for your time — you'll be entered into a draw…").

#### Recruitment campaign

- Role title + company.
- Up to 5 must-have qualifications (e.g. "5+ years React", "based in UK").
- Up to 3 nice-to-haves.
- Outcome to drive towards: **Book interview** / **Send job spec** / **Disqualify**.
- Interview slot calendar (if "Book interview" — Cal.com / Calendly / built-in availability).

#### Sales campaign

- Product / service name + 1–2 sentence description.
- Up to 3 value propositions (bulleted).
- Call-to-action: **Book a demo** / **Send info pack** / **Qualify (BANT)** / **Free-form**.
- Optional pricing context (helps the AI handle objections).
- Optional competitor list to position against.

#### Custom campaign

- Free-form text prompt describing the goal of the call.
- Up to 5 structured fields the AI should try to extract from the conversation.

#### Common to all types

- Campaign name + internal description.
- Voice persona (4–6 presets: e.g. Friendly female / Professional female / Friendly male / Professional male).
- Speaking pace: slow / natural / fast.
- Max call duration (default 5 min, hard cap 15 min).
- Voicemail behaviour: **Leave a message** (AI-generated) / **Hang up** / **Retry later**.
- Retry policy: max attempts (default 2) and gap between attempts (default 24h).
- Calling-hours window (e.g. 09:00–18:00 in recipient's local timezone).
- Days-of-week mask.
- Max concurrent calls (default 20).

### 6.3 Voice agent runtime

| Component | Choice (preliminary) |
|---|---|
| Telephony | Twilio Programmable Voice. Outbound number per workspace, with caller-ID matching campaign region. |
| Voice AI | OpenAI Realtime API as primary; Retell or Vapi as managed fallback. Decision finalised in tech spike. |
| Script delivery | System prompt assembled per call from: campaign brief + contact custom fields. Prompt is templated, not free-form to the operator. |
| Barge-in | Recipient can interrupt the AI at any time and the agent must yield. |
| Recording | Every call recorded; required by US two-party-consent states is handled via the opening disclosure. |
| Disclosure | First sentence of every call: "Hi {name}, this is an AI assistant calling on behalf of {workspace}…". Cannot be removed. |
| Structured extraction | At end of call, a separate LLM pass extracts the campaign-specific fields from the transcript. |

### 6.4 Campaign monitor

- Real-time counts: **In queue**, **Dialling**, **In call**, **Completed**, **Voicemail**, **No answer**, **Failed**.
- Aggregate progress bar.
- Live activity feed (last ~20 events).
- Filterable list of every call in the campaign by status / outcome.
- Pause / Resume / Stop buttons (Stop is destructive — confirmation required).
- Cost-so-far estimate.

### 6.5 Call detail

- Contact info header.
- Outcome label (editable; AI-suggested).
- Full timestamped transcript (operator + AI bubbles).
- Audio playback (S3-hosted, signed URL).
- AI-extracted structured fields (campaign-specific).
- Operator notes (free text).
- "Mark for follow-up" → adds a personal task with a callback date.

### 6.6 Compliance & legality

| Concern | Mitigation |
|---|---|
| US TCPA | Operators must self-certify they have a valid calling basis for every contact uploaded (consent / prior business relationship). DNC lookup (national + state) before each call. Disclosure at call start. |
| UK/EU PECR & GDPR | Same as above. DPA template available for workspaces. |
| Calling hours | Enforce per-recipient timezone window. Default conservative: 09:00–18:00 local, Mon–Fri. |
| Opt-out detection | AI listens for phrases like "don't call again", "remove me from your list". On detection: end the call politely + add contact to DNC + flag the campaign. |
| Recording consent | Opening disclosure includes "this call is being recorded". |
| Killswitch | Operator can stop a campaign instantly. Platform admin can stop a workspace. |

### 6.7 Auth, billing, multi-tenancy

| | |
|---|---|
| Auth | Email + password (AWS Cognito). Magic-link sign-in supported. |
| Tenancy | One workspace per account at MVP. Data isolated by `workspaceId` partition key. |
| Billing | Stripe. Pricing TBD; current placeholder: $0.20/connected-minute, $0.05/dial-attempt (passes telephony + AI cost + margin). Pre-paid credit model to avoid post-paid surprise bills. |

---

## 7. Tech architecture (high-level)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser — Next.js app (operator UI)                                 │
└─────────────┬───────────────────────────────────────────┬────────────┘
              │ REST/WebSocket                            │ HTTPS
              ▼                                           ▼
┌─────────────────────────────┐         ┌────────────────────────────────┐
│  API Gateway + Lambda       │         │  Stripe / Cal.com (3rd party)  │
│  - workspace/auth           │         └────────────────────────────────┘
│  - contacts CRUD            │
│  - campaigns CRUD           │
│  - call orchestrator        │
└─────────┬─────────┬─────────┘
          │         │
          │         └────────────────────┐
          ▼                              ▼
┌──────────────────┐         ┌──────────────────────────────────────┐
│  DynamoDB        │         │  Call worker (Fargate / Lambda)      │
│  - contacts      │         │  - dial via Twilio                   │
│  - campaigns     │         │  - bridge media to voice AI          │
│  - calls         │         │  - on hangup → write transcript+S3   │
│  - extracts      │         └──────┬──────────────────┬────────────┘
└──────────────────┘                │                  │
                                    ▼                  ▼
                          ┌──────────────────┐  ┌──────────────────┐
                          │  Twilio          │  │  OpenAI Realtime │
                          │  Programmable    │  │  (or Retell/Vapi)│
                          │  Voice           │  │                  │
                          └──────────────────┘  └──────────────────┘
```

- **Frontend**: Next.js 16 App Router (consistent with existing hafiz.in stack).
- **Auth**: AWS Cognito.
- **Hosting**: AWS Amplify (frontend) + AWS Lambda / Fargate (backend).
- **Database**: DynamoDB single-table or Aurora Postgres (decision TBD; DynamoDB favoured for write throughput during campaigns).
- **Storage**: S3 (recordings, uploaded CSVs).
- **Region**: eu-west-2 primary (matches hafiz.in infra).

---

## 8. Risks & open questions

| Risk | Severity | Mitigation |
|---|---|---|
| AI says something off-brand / wrong / hallucinated | High | Strict system prompt with explicit "do not" list; guardrail LLM-as-judge on the first N calls of each campaign; operator must sample-review the first 5 calls before the rest go out. |
| Recipients react negatively to AI calls | Med | Mandatory disclosure at call start. Opt-out detection. Operator-facing acceptance-rate metric so they can iterate. |
| Latency makes the AI feel robotic | High | Use voice-to-voice models (no STT→LLM→TTS chain). Target sub-500ms response. |
| Regulatory (TCPA, PECR) | High | Operator self-certify + DNC scrubbing + calling-hours enforcement + audit log of consent claim. Get legal review before launch. |
| Telephony cost explodes during runaway campaign | Med | Hard per-workspace daily cap. Pre-paid credits. |
| Twilio account flagged for spam | High | Per-workspace number rotation, warm-up of new numbers, monitor STIR/SHAKEN attestation. |
| Voicemail detection accuracy | Med | Twilio AMD has known false-positives; consider Twilio's "answered by" + custom audio classifier. |

### Open questions

1. **Build vs buy on voice agent**: OpenAI Realtime is more flexible but Retell/Vapi handle the telephony+AI integration for us. Spike both before deciding.
2. **Pricing model**: per-minute + per-attempt covers cost but is hard for customers to forecast. Should we offer a subscription tier with included minutes?
3. **First vertical to launch with**: Sales has the biggest TAM but recruitment is more defensible (structured outcomes). Survey is easiest to demonstrate quality. Recommendation: launch with **Sales + Survey** at the same time, add Recruitment in v1.1.
4. **Inbound calls**: do we offer a phone number for return-calls in v1? Probably yes — at least route them to voicemail + transcribe.
5. **Brand & name**: "anycaller" is a placeholder. Need a name that signals AI without sounding gimmicky and that has a clean .com.

---

## 9. Phased roadmap

### Phase 1 — MVP (6–8 weeks)

- Single-user workspaces
- Contacts: CSV import, tags, DNC
- Campaign types: **Survey**, **Sales**, **Custom**
- Voice agent runtime (Twilio + OpenAI Realtime)
- Campaign monitor + call detail
- CSV export of results
- Stripe credits-based billing

### Phase 2 (8–12 weeks after MVP)

- **Recruitment** campaign type with calendar integration
- **SMS** and **Email** campaigns (same campaign model, different channel)
- Multi-user workspaces with roles (admin, operator, viewer)
- A/B testing of scripts within a campaign
- Webhooks for outcomes

### Phase 3 (12+ weeks after MVP)

- CRM integrations: HubSpot, Salesforce, Zapier
- Inbound number with AI receptionist
- Advanced analytics (cohort outcomes, time-of-day heatmaps)
- Multi-language support (Spanish, French, German first)

---

## 10. Success metrics

| Metric | Target by end of phase 1 |
|---|---|
| Activation: % of signups launching a campaign within 7d | ≥40% |
| Volume: calls placed per day across all customers | ≥10,000/day |
| Quality: blind reviewer rating (1–5) of random call samples | ≥4.0 avg |
| Outcome accuracy: % of calls where AI-extracted fields match human-reviewer labels | ≥85% |
| Operator efficiency: avg campaign size / hours of operator time | ≥500 contacts / hr |
| Gross margin per minute | ≥50% |

---

## 11. Appendix — Glossary

- **Campaign** — A configured outbound calling effort with a defined audience, script, and schedule.
- **Contact** — A single phone-reachable person, with optional metadata.
- **Outcome** — The post-call label describing how the conversation ended (e.g. Interested, Not interested, Voicemail, Callback requested).
- **Extracted fields** — Structured data parsed out of the transcript by a second LLM pass, defined by the campaign type.
- **DNC** — Do Not Call. A contact-level flag that excludes them from all campaigns.
- **AMD** — Answering Machine Detection. Twilio's classifier for whether a call was picked up by a human or voicemail.
