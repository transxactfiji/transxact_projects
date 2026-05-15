"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import AppButton from "@/app/ui/appButton";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <section className="workflow-stack">
      <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "480px", margin: "4rem auto" }}>
        <FiAlertTriangle size={48} style={{ color: "var(--error)", marginBottom: "1rem" }} />
        <h1 style={{ margin: "0 0 0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <AppButton
          onClick={() => reset()}
          startIcon={<FiRefreshCw aria-hidden="true" />}
        >
          Try Again
        </AppButton>
        {process.env.NODE_ENV === "development" && error.message && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1.5rem", textAlign: "left", wordBreak: "break-word" }}>
            {error.message}
          </p>
        )}
      </div>
    </section>
  );
}
