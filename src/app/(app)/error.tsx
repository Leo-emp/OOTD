"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        <h2 className="font-heading text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <button
          onClick={reset}
          className="rounded-xl gradient-bg px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
