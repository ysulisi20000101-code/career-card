"use client";

import { useEffect, useState } from "react";

interface UseClientValueResult<T> {
  value: T;
  loading: boolean;
}

/**
 * Defer a client-only value (e.g. localStorage read) until after hydration.
 * Returns `fallback` during SSR and first client render, then `factory()` on mount.
 * `loading` is true until the effect has fired at least once.
 */
export function useClientValue<T>(factory: () => T, fallback: T, deps: unknown[]): UseClientValueResult<T> {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setValue(factory());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factory is stable per deps
  }, deps);
  return { value, loading };
}
