/* Persona + voice catalogs. Mirrored from designs/app-data.jsx.
 * Standard tier is included; premium adds a per-minute uplift. */

export interface Persona {
  id: string;
  label: string;
  tier: "standard" | "premium";
  uplift: number;
  blurb: string;
}

export interface Voice {
  id: string;
  name: string;
  provider: string;
  gender: string;
  tags: string;
  tier: "standard" | "premium";
  uplift: number;
}

export const PERSONAS: Persona[] = [
  { id: "formal",       label: "Formal",       tier: "standard", uplift: 0,    blurb: "Buttoned-up, professional. Plays it straight." },
  { id: "friendly",     label: "Friendly",     tier: "standard", uplift: 0,    blurb: "Warm, casual. Easy small talk before getting to the point." },
  { id: "concise",      label: "Concise",      tier: "standard", uplift: 0,    blurb: "Brisk and direct. Best for reminders and confirmations." },
  { id: "empathetic",   label: "Empathetic",   tier: "premium",  uplift: 0.04, blurb: "Slows down, names emotion. For health, sensitive contexts." },
  { id: "consultative", label: "Consultative", tier: "premium",  uplift: 0.05, blurb: "Asks open-ended questions, summarizes back. Discovery calls." },
  { id: "negotiator",   label: "Negotiator",   tier: "premium",  uplift: 0.06, blurb: "Handles objections with multi-turn back-and-forth." },
  { id: "investigative",label: "Investigative",tier: "premium",  uplift: 0.05, blurb: "Gentle persistence. Probes for specifics without pressing." },
  { id: "bilingual",    label: "Bilingual EN/ES", tier: "premium", uplift: 0.08, blurb: "Detects callee language and switches mid-call." },
];

export const VOICES: Voice[] = [
  { id: "sage",  name: "Sage",        provider: "ElevenLabs",          gender: "female", tags: "US · warm",        tier: "standard", uplift: 0 },
  { id: "aria",  name: "Aria",        provider: "ElevenLabs",          gender: "female", tags: "US · neutral",     tier: "standard", uplift: 0 },
  { id: "brook", name: "Brook",       provider: "ElevenLabs",          gender: "male",   tags: "US · neutral",     tier: "standard", uplift: 0 },
  { id: "theo",  name: "Theo",        provider: "VAPI",                gender: "male",   tags: "UK · concise",     tier: "standard", uplift: 0 },
  { id: "lior",  name: "Lior",        provider: "ElevenLabs · Studio", gender: "female", tags: "US · expressive",  tier: "premium",  uplift: 0.12 },
  { id: "nico",  name: "Nico",        provider: "ElevenLabs · Studio", gender: "male",   tags: "US · warm bass",   tier: "premium",  uplift: 0.10 },
  { id: "mira",  name: "Mira",        provider: "ElevenLabs · ML v2",  gender: "female", tags: "29 languages",     tier: "premium",  uplift: 0.18 },
];

export const CAMPAIGN_TYPES = [
  { id: "survey", label: "Survey",  blurb: "Open-ended questions, NPS follow-ups, customer research." },
  { id: "sales",  label: "Sales",   blurb: "Cold outreach, qualification, book a demo." },
  { id: "custom", label: "Custom",  blurb: "Free-form brief. Bring your own structure." },
] as const;

export type CampaignTypeId = (typeof CAMPAIGN_TYPES)[number]["id"];
