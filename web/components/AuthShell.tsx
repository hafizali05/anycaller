"use client";

/* anycaller — shared shell for auth pages (login / signup). Centered card
 * on the warm paper canvas; matches the design system in components/ui. */

import React from "react";
import { Wordmark } from "@/components/ui";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <Wordmark size={22} live />
        </div>

        <div
          style={{
            background: "var(--paper-2)",
            borderRadius: 14,
            padding: "32px 32px",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "10px 0 24px",
                color: "var(--ink-2)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
          {!subtitle && <div style={{ height: 24 }} />}
          {children}
        </div>

        {footer && (
          <div
            style={{
              marginTop: 18,
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-2)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

export const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid var(--border-2)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: 14,
  outline: "none",
};

export const errorStyle: React.CSSProperties = {
  margin: "8px 0 0",
  padding: "8px 10px",
  borderRadius: 6,
  background: "var(--accent-soft)",
  color: "var(--accent-2)",
  fontSize: 12.5,
  fontFamily: "var(--font-mono)",
};

export const infoStyle: React.CSSProperties = {
  margin: "8px 0 0",
  padding: "8px 10px",
  borderRadius: 6,
  background: "var(--sage-soft)",
  color: "var(--sage)",
  fontSize: 12.5,
};
