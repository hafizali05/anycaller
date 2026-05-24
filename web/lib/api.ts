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
