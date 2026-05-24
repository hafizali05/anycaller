"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { AuthShell, errorStyle, infoStyle, inputStyle } from "@/components/AuthShell";
import { signUp, confirmSignUp, resendCode, signIn } from "@/lib/cognito";

type Mode = "signUp" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
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

  function handleSignUp() {
    return run(async () => {
      await signUp(normEmail(), password);
      setMode("verify");
      setInfo("Verification code sent to your email.");
    });
  }

  function handleVerify() {
    return run(async () => {
      await confirmSignUp(normEmail(), code.trim());
      await signIn(normEmail(), password);
      router.push("/dashboard");
    });
  }

  function handleResend() {
    return run(async () => {
      await resendCode(normEmail());
      setInfo("Verification code re-sent.");
    });
  }

  if (mode === "verify") {
    return (
      <AuthShell
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}.`}
        footer={
          <button onClick={handleResend} disabled={loading} style={linkBtn}>
            Resend code
          </button>
        }
      >
        <input
          style={inputStyle}
          type="text"
          placeholder="6-digit code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        />
        {error && <div style={errorStyle}>{error}</div>}
        {info && <div style={infoStyle}>{info}</div>}
        <div style={{ marginTop: 14 }}>
          <Button variant="accent" size="lg" full onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying…" : "Verify & sign in"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Start free"
      subtitle="Ten minutes on the house. No credit card."
      footer={
        <>
          Already have an account? <Link href="/login" style={linkInline}>Sign in</Link>
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
        placeholder="Password (8+ chars, letters + numbers)"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
      />
      {error && <div style={errorStyle}>{error}</div>}
      {info && <div style={infoStyle}>{info}</div>}
      <div style={{ marginTop: 14 }}>
        <Button variant="accent" size="lg" full onClick={handleSignUp} disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
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
