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
    <section className="flex flex-col items-center justify-center p-4">
      <div className="border rounded-lg bg-card shadow-card text-center py-16 px-8 max-w-[480px] my-16 mx-auto">
        <FiAlertTriangle size={48} className="text-destructive mb-4" />
        <h1 className="mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <AppButton
          onClick={() => reset()}
          startIcon={<FiRefreshCw aria-hidden="true" />}
        >
          Try Again
        </AppButton>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-muted-foreground text-sm mt-6 text-left break-words">
            {error.message}
          </p>
        )}
      </div>
    </section>
  );
}
