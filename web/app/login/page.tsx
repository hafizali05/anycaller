"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { AuthShell, errorStyle, infoStyle, inputStyle } from "@/components/AuthShell";
import { signIn, forgotPassword, confirmNewPassword } from "@/lib/cognito";

type Mode = "signIn" | "forgot" | "resetPassword";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const normEmail = () => email.trim().toLowerCase();

  async function run(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await action();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSignIn() {
    return run(async () => {
      await signIn(normEmail(), password);
      router.push("/dashboard");
    });
  }
  function handleForgot() {
    return run(async () => {
      await forgotPassword(normEmail());
      setMode("resetPassword");
      setInfo("Reset code sent. Enter it with a new password.");
    });
  }
  function handleReset() {
    return run(async () => {
      await confirmNewPassword(normEmail(), code.trim(), newPassword);
      setMode("signIn");
      setInfo("Password reset. Sign in with your new password.");
      setPassword("");
      setCode("");
      setNewPassword("");
    });
  }

  if (mode === "forgot") {
    return (
      <AuthShell
        title="Reset password"
        subtitle="We'll email you a code."
        footer={
          <button
            onClick={() => {
              setMode("signIn");
              setError("");
              setInfo("");
            }}
            style={linkBtn}
          >
            Back to sign in
          </button>
        }
      >
        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleForgot()}
        />
        {error && <div style={errorStyle}>{error}</div>}
        {info && <div style={infoStyle}>{info}</div>}
        <div style={{ marginTop: 14 }}>
          <Button variant="accent" size="lg" full onClick={handleForgot} disabled={loading}>
            {loading ? "Sending…" : "Send code"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (mode === "resetPassword") {
    return (
      <AuthShell
        title="New password"
        subtitle={email}
        footer={
          <button
            onClick={() => {
              setMode("signIn");
              setError("");
              setInfo("");
            }}
            style={linkBtn}
          >
            Back to sign in
          </button>
        }
      >
        <input
          style={inputStyle}
          type="text"
          placeholder="Code from email"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />
        {error && <div style={errorStyle}>{error}</div>}
        {info && <div style={infoStyle}>{info}</div>}
        <div style={{ marginTop: 14 }}>
          <Button variant="accent" size="lg" full onClick={handleReset} disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to any/call."
      footer={
        <>
          New here? <Link href="/signup" style={linkInline}>Create an account</Link>
        </>
      }
    >
      <input
        style={inputStyle}
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={inputStyle}
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
      />
      {error && <div style={errorStyle}>{error}</div>}
      {info && <div style={infoStyle}>{info}</div>}
      <div style={{ marginTop: 14 }}>
        <Button variant="accent" size="lg" full onClick={handleSignIn} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </div>
      <div style={{ marginTop: 12, textAlign: "right" }}>
        <button
          style={linkBtn}
          onClick={() => {
            setMode("forgot");
            setError("");
            setInfo("");
          }}
        >
          Forgot password?
        </button>
      </div>
    </AuthShell>
  );
}

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--accent-2)",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
};

const linkInline: React.CSSProperties = {
  color: "var(--accent-2)",
  textDecoration: "underline",
};
