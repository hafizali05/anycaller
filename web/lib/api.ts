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
