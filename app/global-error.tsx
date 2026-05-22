"use client";
import { useEffect } from "react";

/**
 * Catches errors thrown in the root layout itself. Replaces the whole
 * document, so globals.css (imported by the bypassed layout) is NOT
 * available here — styles are inlined to stay on-brand and robust.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          color: "#1A2230",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 20px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #1E40AF, #2563EB)",
            }}
          />
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#94A0B0",
              margin: 0,
            }}
          >
            Kritická chyba
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "8px 0 0",
            }}
          >
            Aplikaci se nepodařilo načíst.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#687385", marginTop: 12 }}>
            Omlouváme se. Zkuste stránku načíst znovu.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563EB",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Zkusit znovu
          </button>
        </div>
      </body>
    </html>
  );
}
