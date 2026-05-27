# KYC / user verification — minimum viable (UK, B2C)

**Slice:** Anti-abuse user verification — minimum implementation.
**Owner:** Hafiz.
**Status:** Planned. Not started.
**Created:** 2026-05-27.

---

## 1. Goal in one sentence

Block bot signups and obvious stolen-card abuse without adding any
user-visible step beyond what we'd already collect for billing.

## 2. Scope (locked)

- **Jurisdiction:** UK only.
- **Customer type:** B2C only.
- **Philosophy:** **minimum**. Every layer below earns its place; if a
  layer can be deferred without immediate abuse exposure, it is. See §6
  for what was considered and cut, and the conditions under which we'd
  add it back.

## 3. The stack

Two checkpoints. Nothing else.

### 3.1 At signup — invisible

Two pieces, neither user-visible:

**(a) Bot challenge — AWS WAF `Challenge` action attached to the
Cognito user pool.** Silent JS browser-fingerprint challenge — direct
equivalent to Cloudflare Turnstile, but native to AWS and applied at
the user-pool layer, so it requires zero frontend code and no
verification step inside our Lambda. Web ACL lives in `eu-west-2`,
associated with user pool `eu-west-2_Qkl0aTzBv`. Cost: ~$6/mo flat at
MVP volume (web ACL $5 + 1 rule $1 + $0.20/1k challenges).

**(b) Email-domain checks — Cognito PreSignUp Lambda trigger.** Rejects
the signup if the email domain is on the bundled
`disposable-email-domains` list, or if its domain has no MX record.

That's the whole signup gate. Cognito's existing email-code verification
already runs after.

Rejected alternatives: Cloudflare Turnstile (free, but adds a Cloudflare
account dependency, a `<script>` tag, an env var, and ~10 lines of
token-verify code — non-trivially more code than WAF for $6/mo
saved). WAF ACFP managed rule group ($10/mo + per-request, ML-based —
overkill at MVP).

### 3.2 Before first launch *or* first top-up — Stripe SetupIntent + 3DS

The user has to add a card before billing anyway. We move that step in
front of the first campaign launch as well, and we force 3DS — so the
card-collection step doubles as the KYC step. No phone OTP, no ID
upload, no extra modal beyond the one we'd already build for Stripe.

- `POST /kyc/card/setup-intent` — server creates a Stripe `SetupIntent`
  with `payment_method_options.card.request_three_d_secure="any"` and
  `usage="off_session"`. Returns `client_secret`.
- Browser uses `stripe.confirmCardSetup` — 3DS modal fires.
- Stripe webhook `setup_intent.succeeded` writes the PM ID to the
  workspace row.
- Stripe Radar runs automatically (built-in, free). Block on
  `risk_level=highest`.

A FastAPI dependency `require_card_verified` protects
`/campaigns/{id}/launch` and `/billing/topup`. The frontend
`<CardGate />` component (modelled on the existing `AttestModal`)
intercepts the action when the card is missing.

## 4. Cross-cutting (kept minimum)

- **Global daily dial cap** — single number across all workspaces (e.g.
  500 dials/day) until we see real traffic patterns. Enforced in the
  call orchestrator. Not per-tier — there are no tiers.
- **Audit log** — KYC events (`signup`, `card_added`, `radar_flag`) into
  DDB `pk=WS#<id>, sk=KYC#<ISO8601>`. One-table-schema fit.
- **GDPR / DPA 2018** — privacy policy lists name + email + payment
  method. No raw ID images held by us (we don't run an ID check at
  MVP). Right-to-erasure deletes Cognito user + workspace row + KYC
  log + Stripe customer.

## 5. Code touch-points

- `web/app/signup/page.tsx` — no changes. WAF Challenge is transparent.
- `web/components/CardGate.tsx` — **new**, mirrors `AttestModal`.
- `web/lib/kyc.ts` — **new**, thin API client.
- `server/app/cognito_triggers/pre_signup.py` — **new** Lambda handler:
  disposable-email + MX check only.
- `server/app/routes/kyc.py` — **new**, one endpoint (`/kyc/card/setup-intent`).
- `server/app/routes/webhooks_stripe.py` — extend with
  `setup_intent.succeeded` handler.
- `server/app/auth.py` — add `require_card_verified` dependency next
  to the existing `CognitoUser`.
- `template.yaml` —
  - Cognito `LambdaConfig.PreSignUp` + new Lambda.
  - `AWS::WAFv2::WebACL` (scope `REGIONAL`, default `Allow`, single rule
    issuing `Challenge` on the Cognito `SignUp` operation) +
    `AWS::WAFv2::WebACLAssociation` targeting the user pool ARN.
  - Env vars `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`.

No new DDB table. New PK prefix: `KYC#`.

## 6. What was considered and cut

Recorded so we don't relitigate. Each one has a clear re-add trigger.

| Cut | Re-add when |
|---|---|
| **Twilio Verify phone OTP** — bind account to a non-VoIP UK mobile | We see abuse from accounts using valid cards but throwaway identities. ~2 days to add back. |
| **UK HMT OFSI sanctions screen** | We onboard our first enterprise customer, or US calling launches, or Stripe / Twilio asks. |
| **Stripe Identity gov-ID + selfie (T2)** | First account hits the daily-dial cap repeatedly, or first chargeback, or first regulator complaint. ~2 days to add back. |
| **IP reputation (IPQS / MaxMind)** | Turnstile + 3DS proves insufficient against bot signups. |
| **Device fingerprinting (FingerprintJS)** | We see account-farming patterns (same device, multiple accounts). |
| **Per-tier velocity caps** | After MVP, when we have data to calibrate. Single global cap is enough at v1. |
| **Companies House / B2B path** | We open up to B2B accounts. |
| **Manual review queue** | We start getting Radar / chargeback flags that need human triage. |

## 7. What we accept by going minimum

- A motivated abuser with a valid card that passes 3DS **can** sign up
  and run calls up to the daily cap. Mitigations: Radar flags, the
  PRD §6.6 launch self-cert, the existing operator-must-sample-first-5
  rule from PRD §8.
- No phone-number-uniqueness gate, so one human could in theory open
  multiple accounts with different emails + different cards. Real-world
  friction: a different *working* card per account.
- No sanctions paper trail. Fine at MVP scale; revisit before US
  calling or any volume above a few hundred users.

If any of these becomes a real problem, every cut layer in §6 slots
back in without re-architecting.

## 8. Build order

Two PRs.

1. **Signup gate** — WAF web ACL + Challenge rule + user-pool
   association + PreSignUp Lambda for disposable/MX check + audit
   log. ~1 day. Ship first.
2. **Card gate** — SetupIntent + 3DS + Radar webhook +
   `<CardGate />` + `require_card_verified`. ~1 day. Ships alongside
   the Stripe billing slice.

Total: ~2 working days. No third-party identity vendor signup needed —
WAF + Cognito + Stripe are accounts we already have.
