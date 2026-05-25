"use client";

/* anycaller backend API client. Wraps fetch with the Cognito ID token. */

import { getIdToken } from "./cognito";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface Me {
  sub: string;
  email: string | null;
  workspace: Workspace;
}

export interface Contact {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  tags: string[];
  custom: Record<string, unknown>;
  dnc: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactIn {
  phone: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  tags?: string[];
  custom?: Record<string, unknown>;
}

export interface BulkResult {
  created: number;
  skippedDuplicate: number;
  invalid: { row: string; reason: string }[];
}

export type CampaignType = "survey" | "sales" | "custom";
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed";
export type Pace = "slow" | "natural" | "fast";
export type VoicemailBehavior = "leave" | "hangup" | "retry";
export type ScheduleMode = "now" | "scheduled";

export interface Schedule {
  mode: ScheduleMode;
  scheduledAt: string | null;
}

export interface Campaign {
  id: string;
  type: CampaignType;
  name: string;
  brief: string;
  persona: string;
  voice: string;
  pace: Pace;
  voicemail: VoicemailBehavior;
  maxDurationMin: number;
  retryMaxAttempts: number;
  retryGapHours: number;
  maxConcurrent: number;
  audienceTags: string[];
  schedule: Schedule;
  status: CampaignStatus;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignIn {
  type?: CampaignType;
  name: string;
  brief?: string;
  persona?: string;
  voice?: string;
  pace?: Pace;
  voicemail?: VoicemailBehavior;
  maxDurationMin?: number;
  retryMaxAttempts?: number;
  retryGapHours?: number;
  maxConcurrent?: number;
  audienceTags?: string[];
  schedule?: Schedule;
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!BASE_URL) {
    throw new Error(
      "API not configured. Set NEXT_PUBLIC_API_BASE_URL to the Function URL after `sam deploy`.",
    );
  }
  const token = await getIdToken();
  if (!token) throw new Error("Not signed in");

  const url = BASE_URL.replace(/\/$/, "") + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${body}`);
  }
  return res;
}

export async function fetchMe(): Promise<Me> {
  const res = await authedFetch("/workspaces/me");
  return (await res.json()) as Me;
}

export async function listContacts(q = ""): Promise<{ items: Contact[] }> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await authedFetch(`/contacts${qs}`);
  return (await res.json()) as { items: Contact[] };
}

export async function createContact(input: ContactIn): Promise<Contact> {
  const res = await authedFetch("/contacts", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as Contact;
}

export async function bulkCreateContacts(rows: ContactIn[]): Promise<BulkResult> {
  const res = await authedFetch("/contacts/bulk", { method: "POST", body: JSON.stringify(rows) });
  return (await res.json()) as BulkResult;
}

export async function patchContact(id: string, patch: Partial<ContactIn> & { dnc?: boolean }): Promise<Contact> {
  const res = await authedFetch(`/contacts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return (await res.json()) as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  await authedFetch(`/contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listCampaigns(): Promise<{ items: Campaign[] }> {
  const res = await authedFetch("/campaigns");
  return (await res.json()) as { items: Campaign[] };
}

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}`);
  return (await res.json()) as Campaign;
}

export async function createCampaign(input: CampaignIn): Promise<Campaign> {
  const res = await authedFetch("/campaigns", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as Campaign;
}

export async function patchCampaign(id: string, patch: Partial<CampaignIn>): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return (await res.json()) as Campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  await authedFetch(`/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function launchCampaign(id: string): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}/launch`, { method: "POST" });
  return (await res.json()) as Campaign;
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}/pause`, { method: "POST" });
  return (await res.json()) as Campaign;
}

export async function resumeCampaign(id: string): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}/resume`, { method: "POST" });
  return (await res.json()) as Campaign;
}

export async function stopCampaign(id: string): Promise<Campaign> {
  const res = await authedFetch(`/campaigns/${encodeURIComponent(id)}/stop`, { method: "POST" });
  return (await res.json()) as Campaign;
}

export type CallStatus = "queued" | "ringing" | "live" | "completed" | "voicemail" | "failed" | "optout";
export type CallOutcome = "yes" | "maybe" | "no" | null;

export interface TranscriptLine {
  who: "ava" | "them";
  t: string;
  text: string;
}

export interface ExtractedField {
  value: unknown;
  confidence: number | null;
}

export interface Call {
  id: string;
  campaignId: string;
  contactId: string;
  status: CallStatus;
  outcome: CallOutcome;
  attempt: number;
  durationSec: number | null;
  startedAt: string | null;
  endedAt: string | null;
  transcript: TranscriptLine[];
  extraction: Record<string, ExtractedField>;
  recordingUrl: string | null;
  sentiment: string | null;
  snippet: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCalls(campaignId = ""): Promise<{ items: Call[] }> {
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
  const res = await authedFetch(`/calls${qs}`);
  return (await res.json()) as { items: Call[] };
}

export async function getCall(id: string): Promise<Call> {
  const res = await authedFetch(`/calls/${encodeURIComponent(id)}`);
  return (await res.json()) as Call;
}

export interface Brief {
  id: string;
  name: string;
  type: CampaignType;
  brief: string;
  persona: string;
  voice: string;
  pace: Pace;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BriefIn {
  name: string;
  type?: CampaignType;
  brief?: string;
  persona?: string;
  voice?: string;
  pace?: Pace;
}

export async function listBriefs(): Promise<{ items: Brief[] }> {
  const res = await authedFetch("/briefs");
  return (await res.json()) as { items: Brief[] };
}

export async function getBrief(id: string): Promise<Brief> {
  const res = await authedFetch(`/briefs/${encodeURIComponent(id)}`);
  return (await res.json()) as Brief;
}

export async function createBrief(input: BriefIn): Promise<Brief> {
  const res = await authedFetch("/briefs", { method: "POST", body: JSON.stringify(input) });
  return (await res.json()) as Brief;
}

export async function patchBrief(id: string, patch: Partial<BriefIn>): Promise<Brief> {
  const res = await authedFetch(`/briefs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return (await res.json()) as Brief;
}

export async function deleteBrief(id: string): Promise<void> {
  await authedFetch(`/briefs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
