// app-data.jsx — sample data for the any/call prototype
// All centered on the accounting-software brief from the PRD appendix.

const SAMPLE_BRIEF = `I'm selling accounting software to small businesses in the US. Please call the business, confirm you're speaking with someone who handles their books, and ask: (1) whether they currently use any accounting software, (2) which one, (3) what they like and dislike about it, and (4) whether they'd be open to a 15-minute demo next week. Be friendly and don't push if they say no.`;

// ───────────────── Persona catalog ─────────────────
// Standard tier is included in the per-minute base rate.
// Premium tier adds an "uplift" to the per-minute cost (USD).
const PERSONAS = [
  // Standard — included
  { id: 'formal',    label: 'Formal',     tier: 'standard', uplift: 0,    blurb: 'Buttoned-up, professional. Plays it straight.',                  default: true },
  { id: 'friendly',  label: 'Friendly',   tier: 'standard', uplift: 0,    blurb: 'Warm, casual. Easy small talk before getting to the point.' },
  { id: 'concise',   label: 'Concise',    tier: 'standard', uplift: 0,    blurb: 'Brisk and direct. Best for reminders and confirmations.' },
  // Premium
  { id: 'empathetic',  label: 'Empathetic',  tier: 'premium', uplift: 0.04, blurb: 'Slows down, names emotion. For health, sensitive contexts.' },
  { id: 'consultative',label: 'Consultative',tier: 'premium', uplift: 0.05, blurb: 'Asks open-ended questions, summarizes back. Discovery calls.' },
  { id: 'negotiator',  label: 'Negotiator',  tier: 'premium', uplift: 0.06, blurb: 'Handles objections with multi-turn back-and-forth.' },
  { id: 'investigative',label:'Investigative',tier:'premium', uplift: 0.05, blurb: 'Gentle persistence. Probes for specifics without pressing.' },
  { id: 'bilingual',   label: 'Bilingual EN/ES', tier: 'premium', uplift: 0.08, blurb: 'Detects callee language and switches mid-call.' },
];

// ───────────────── Voice catalog ─────────────────
const VOICES = [
  // Standard
  { id: 'sage',  name: 'Sage',  provider: 'ElevenLabs',          gender: 'female', tags: 'US · warm',     tier: 'standard', uplift: 0,    default: true },
  { id: 'aria',  name: 'Aria',  provider: 'ElevenLabs',          gender: 'female', tags: 'US · neutral',  tier: 'standard', uplift: 0 },
  { id: 'brook', name: 'Brook', provider: 'ElevenLabs',          gender: 'male',   tags: 'US · neutral',  tier: 'standard', uplift: 0 },
  { id: 'theo',  name: 'Theo',  provider: 'VAPI',                gender: 'male',   tags: 'UK · concise',  tier: 'standard', uplift: 0 },
  // Premium
  { id: 'lior',  name: 'Lior',  provider: 'ElevenLabs · Studio', gender: 'female', tags: 'US · expressive',  tier: 'premium',  uplift: 0.12 },
  { id: 'nico',  name: 'Nico',  provider: 'ElevenLabs · Studio', gender: 'male',   tags: 'US · warm bass',   tier: 'premium',  uplift: 0.10 },
  { id: 'mira',  name: 'Mira',  provider: 'ElevenLabs · ML v2',  gender: 'female', tags: '29 languages',     tier: 'premium',  uplift: 0.18 },
  { id: 'clone', name: 'Your clone', provider: 'Voice clone',     gender: '—',      tags: 'bring your own',   tier: 'premium',  uplift: 0.30 },
];

const GENERATED_AGENT = {
  name: 'Ava',
  persona: 'friendly',
  voice: 'Sage · ElevenLabs',
  opening: "Hi, this is Ava calling from Numerus. I work with small businesses on their accounting tools — do you have a quick minute?",
  objectives: [
    { id: 1, label: 'Confirm bookkeeping contact', detail: 'Are you the one who handles the books?' },
    { id: 2, label: 'Current accounting software', detail: 'Which tool, if any.' },
    { id: 3, label: 'Likes & dislikes', detail: 'Probe gently for specifics.' },
    { id: 4, label: 'Offer 15-min demo next week', detail: 'Only if interest is warm.' },
  ],
  fallbacks: [
    { trigger: 'Not the right person', response: 'Ask politely for a referral, then thank and end.' },
    { trigger: 'Not interested', response: 'Thank them, do not push, end the call.' },
    { trigger: '"Is this AI?"', response: 'Disclose honestly. Continue if they consent.' },
    { trigger: 'Voicemail', response: 'Leave 18-second callback message.' },
  ],
  extraction: [
    { key: 'contact_role',     type: 'string', hint: 'owner / bookkeeper / accountant / other' },
    { key: 'current_software', type: 'string', hint: 'QuickBooks, Xero, FreshBooks, spreadsheet, none' },
    { key: 'likes',            type: 'text',   hint: 'free text' },
    { key: 'dislikes',         type: 'text',   hint: 'free text' },
    { key: 'demo_interest',    type: 'enum',   hint: 'yes / no / maybe' },
    { key: 'callback_time',    type: 'datetime?', hint: 'optional' },
  ],
  closing: "Great — I'll send a calendar invite to the email on file. Thanks for your time today.",
  maxDurationMin: 6,
};

const CONTACTS = [
  { id: 'c1',  name: 'Mara Ortega',   company: 'Ortega Roofing',         phone: '+1 (415) 555-0142', tz: 'PT', status: 'completed', outcome: 'yes' },
  { id: 'c2',  name: 'Jin Park',      company: 'Park Family Dental',     phone: '+1 (917) 555-0119', tz: 'ET', status: 'live',      outcome: null },
  { id: 'c3',  name: 'Hannah Weiss',  company: 'Weiss & Co Bookkeeping', phone: '+1 (303) 555-0188', tz: 'MT', status: 'ringing',   outcome: null },
  { id: 'c4',  name: 'Diego Aranda',  company: 'Aranda Auto Body',       phone: '+1 (305) 555-0177', tz: 'ET', status: 'queued',    outcome: null },
  { id: 'c5',  name: 'Priya Shah',    company: 'Shah Boutique',          phone: '+1 (646) 555-0163', tz: 'ET', status: 'completed', outcome: 'maybe' },
  { id: 'c6',  name: 'Tom Halloran',  company: 'Halloran HVAC',          phone: '+1 (617) 555-0151', tz: 'ET', status: 'voicemail', outcome: null },
  { id: 'c7',  name: 'Aria Kim',      company: 'Kim Studio',             phone: '+1 (510) 555-0124', tz: 'PT', status: 'queued',    outcome: null },
  { id: 'c8',  name: 'Roberto Salas', company: 'Salas Plumbing',         phone: '+1 (213) 555-0102', tz: 'PT', status: 'queued',    outcome: null },
  { id: 'c9',  name: 'Yuki Tanaka',   company: 'Tanaka Bakery',          phone: '+1 (415) 555-0190', tz: 'PT', status: 'completed', outcome: 'no' },
  { id: 'c10', name: 'Devon Bryant',  company: 'Bryant Landscaping',     phone: '+1 (704) 555-0148', tz: 'ET', status: 'failed',    outcome: null },
  { id: 'c11', name: 'Lior Cohen',    company: 'Cohen Optometry',        phone: '+1 (212) 555-0166', tz: 'ET', status: 'completed', outcome: 'yes' },
  { id: 'c12', name: 'Sara Petit',    company: 'Petit Floral',           phone: '+1 (415) 555-0115', tz: 'PT', status: 'queued',    outcome: null },
  { id: 'c13', name: 'Karim Idris',   company: 'Idris Tax Prep',         phone: '+1 (832) 555-0193', tz: 'CT', status: 'queued',    outcome: null },
  { id: 'c14', name: 'Nora Beck',     company: 'Beck PT Clinic',         phone: '+1 (206) 555-0136', tz: 'PT', status: 'queued',    outcome: null },
];

// Detail for the one live call in progress (Jin Park)
const LIVE_CALL = {
  id: 'c2',
  contact: CONTACTS[1],
  elapsed: 47, // seconds
  turns: [
    { who: 'ava',  t: '00:00', text: "Hi, this is Ava calling from Numerus. I work with small businesses on their accounting tools — do you have a quick minute?" },
    { who: 'them', t: '00:08', text: "Uh — sure. What's this about?" },
    { who: 'ava',  t: '00:11', text: "Quick one: are you the person who handles the books for Park Family Dental?" },
    { who: 'them', t: '00:18', text: "That'd be my wife, but I do most of it day to day." },
    { who: 'ava',  t: '00:24', text: "Got it. Mind if I ask — what are you using to track receipts and run payroll right now?" },
    { who: 'them', t: '00:31', text: "QuickBooks Online. We've had it for, I don't know, six years." },
    { who: 'ava',  t: '00:39', text: "Six years is a long relationship. What works well, and what bugs you?" },
  ],
  liveText: "We mostly like it — but the payroll add-on got expensive after the last price",
};

// One completed call detail (Mara Ortega — the YES)
const COMPLETED_CALL = {
  id: 'c1',
  contact: CONTACTS[0],
  duration: '04:18',
  startedAt: 'Today · 10:42 AM PT',
  sentiment: 'positive',
  summary: "Mara handles the books herself for a 6-person roofing crew. Uses QuickBooks Desktop and is frustrated by the manual reconciliation each month. She wasn't aware of cloud alternatives and asked if Numerus syncs with her bank. She agreed to a demo Tuesday at 2pm PT.",
  extraction: {
    contact_role:     { value: 'owner',        confidence: 0.96 },
    current_software: { value: 'QuickBooks Desktop', confidence: 0.99 },
    likes:            { value: 'familiar interface, payroll works', confidence: 0.82 },
    dislikes:         { value: 'manual bank reconciliation, no mobile', confidence: 0.91 },
    demo_interest:    { value: 'yes',          confidence: 0.97 },
    callback_time:    { value: 'Tue · 2:00 PM PT', confidence: 0.94 },
  },
  transcript: [
    { who: 'ava',  t: '00:00', text: "Hi, this is Ava calling from Numerus. I work with small businesses on their accounting tools — do you have a quick minute?" },
    { who: 'them', t: '00:09', text: "Sure, what's it about?" },
    { who: 'ava',  t: '00:12', text: "Quick one — are you the person who handles the books at Ortega Roofing?" },
    { who: 'them', t: '00:19', text: "That's me, yeah. Owner, bookkeeper, everything." },
    { who: 'ava',  t: '00:24', text: "Got it. What are you using to track receipts and payroll today?" },
    { who: 'them', t: '00:31', text: "QuickBooks. The desktop one — we've had it forever." },
    { who: 'ava',  t: '00:37', text: "Anything you love about it? Anything that drives you up the wall?" },
    { who: 'them', t: '00:44', text: "I like that payroll just works. But every month I'm doing this reconciliation by hand — pulling statements, matching things up. It's two evenings of my life." },
    { who: 'ava',  t: '00:59', text: "That's brutal. Are you on a cloud version, or strictly desktop?" },
    { who: 'them', t: '01:08', text: "Desktop. I didn't even know there was a cloud one really." },
    { who: 'ava',  t: '01:14', text: "There is — and one of the things Numerus does is plug into your bank so reconciliation is basically automatic. Would you be open to a 15-minute demo next week? I can show you how it'd look with your numbers." },
    { who: 'them', t: '01:30', text: "Yeah, I'd take a look. Tuesday afternoon?" },
    { who: 'ava',  t: '01:37', text: "Tuesday at 2pm Pacific?" },
    { who: 'them', t: '01:41', text: "Works for me." },
    { who: 'ava',  t: '01:43', text: "Perfect — I'll send the invite to the email we have on file. Thanks for your time, Mara." },
  ],
};

const CAMPAIGNS = [
  { id: 'k1', name: 'Q2 SMB outreach',     status: 'running',   contacts: 142, done: 38,  brief: 'Accounting software qualification' },
  { id: 'k2', name: 'Renewal check-ins',   status: 'scheduled', contacts: 64,  done: 0,   brief: 'NPS + renewal intent' },
  { id: 'k3', name: 'Demo no-shows',       status: 'draft',     contacts: 12,  done: 0,   brief: 'Reschedule demo' },
];

Object.assign(window, {
  SAMPLE_BRIEF, GENERATED_AGENT, CONTACTS, LIVE_CALL, COMPLETED_CALL, CAMPAIGNS,
  PERSONAS, VOICES,
});
