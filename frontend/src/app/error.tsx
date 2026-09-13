"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error caught:", error);
  }, [error]);

  return (
    <div className="py-12 flex justify-center items-center">
      <ErrorState
        title="Application Exception"
        message="An unexpected error occurred while rendering this page."
        requestId={error.digest || "client-digest"}
        onRetry={reset}
        technicalDetails={
          process.env.NODE_ENV === "development" ? error.stack || error.message : undefined
        }
      />
    </div>
  );
}
