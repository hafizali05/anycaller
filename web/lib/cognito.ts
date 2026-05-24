"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* anycaller — Cognito client. Mirrors hafiz.in/lib/cognito.ts, adapted:
 *   - no Identity Pool (backend Lambda is the only DDB writer)
 *   - pool IDs from NEXT_PUBLIC_* env vars (Amplify-injected), not hardcoded
 */

import { loadScript } from "./loadScript";

export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-2",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
  appClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || "",
};

const LIB = {
  cognito:
    "https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6/dist/amazon-cognito-identity.min.js",
};

const W = () => window as any;

let userPool: any = null;
let currentUser: any = null;

async function ensureLibs(): Promise<void> {
  if (!AWS_CONFIG.userPoolId || !AWS_CONFIG.appClientId) {
    throw new Error(
      "Cognito not configured. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_APP_CLIENT_ID after `sam deploy`.",
    );
  }
  await loadScript(LIB.cognito);
  if (!userPool) {
    const A = W().AmazonCognitoIdentity;
    userPool = new A.CognitoUserPool({
      UserPoolId: AWS_CONFIG.userPoolId,
      ClientId: AWS_CONFIG.appClientId,
    });
  }
}

export interface AuthSession {
  email: string;
}

export async function signUp(email: string, password: string): Promise<void> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  await new Promise<void>((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      [new A.CognitoUserAttribute({ Name: "email", Value: email })],
      null,
      (err: any) => (err ? reject(err) : resolve()),
    );
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  const user = new A.CognitoUser({ Username: email, Pool: userPool });
  await new Promise<void>((resolve, reject) => {
    user.confirmRegistration(code, true, (err: any) => (err ? reject(err) : resolve()));
  });
}

export async function resendCode(email: string): Promise<void> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  const user = new A.CognitoUser({ Username: email, Pool: userPool });
  await new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((err: any) => (err ? reject(err) : resolve()));
  });
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  const user = new A.CognitoUser({ Username: email, Pool: userPool });
  const details = new A.AuthenticationDetails({ Username: email, Password: password });
  await new Promise<string>((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: (session: any) => resolve(session.getIdToken().getJwtToken()),
      onFailure: (err: any) => reject(err),
    });
  });
  currentUser = user;
  return { email };
}

export async function currentSession(): Promise<AuthSession | null> {
  await ensureLibs();
  const u = userPool.getCurrentUser();
  if (!u) return null;
  const session: any = await new Promise((resolve) => {
    u.getSession((err: any, s: any) => resolve(err ? null : s));
  });
  if (!session || !session.isValid()) return null;
  currentUser = u;
  return { email: u.getUsername() };
}

export function signOut(): void {
  if (currentUser) {
    try {
      currentUser.signOut();
    } catch {}
  }
  currentUser = null;
}

export async function forgotPassword(email: string): Promise<void> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  const user = new A.CognitoUser({ Username: email, Pool: userPool });
  await new Promise<void>((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err: any) => reject(err),
      inputVerificationCode: () => resolve(),
    });
  });
}

export async function confirmNewPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await ensureLibs();
  const A = W().AmazonCognitoIdentity;
  const user = new A.CognitoUser({ Username: email, Pool: userPool });
  await new Promise<void>((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err: any) => reject(err),
    });
  });
}

/** Raw Cognito ID JWT for the current session, or null. */
export async function getIdToken(): Promise<string | null> {
  await ensureLibs();
  const u = userPool.getCurrentUser();
  if (!u) return null;
  const session: any = await new Promise((resolve) => {
    u.getSession((err: any, s: any) => resolve(err ? null : s));
  });
  if (!session || !session.isValid()) return null;
  return session.getIdToken().getJwtToken() as string;
}
