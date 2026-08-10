"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// SWR-style hook — returns cached data instantly, refreshes in background
// Eliminates blank-screen flickers on page loads by showing stale data first
export function useCachedFetch<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheKey = `ootd-cache:${url}`;
  const mountedRef = useRef(true);

  // On mount: read from sessionStorage first (instant), then fetch fresh data
  useEffect(() => {
    mountedRef.current = true;

    // Step 1: Show cached data instantly (stale-while-revalidate)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}

    // Step 2: Fetch fresh data in background
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((fresh) => {
        if (!mountedRef.current) return;
        setData(fresh);
        setError(null);
        // Update cache for next visit
        try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
      })
      .catch((err) => {
        if (mountedRef.current) setError(err.message);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => { mountedRef.current = false; };
  }, [url, cacheKey]);

  // Manual refresh — force re-fetch and update cache
  const refresh = useCallback(() => {
    fetch(url)
      .then((r) => r.json())
      .then((fresh) => {
        setData(fresh);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
      })
      .catch(() => {});
  }, [url, cacheKey]);

  return { data, loading, error, refresh };
}
