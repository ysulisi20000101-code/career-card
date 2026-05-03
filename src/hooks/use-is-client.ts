"use client";

import { useMemo, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useIsClient(): boolean {
  const clientSnapshot = useMemo(() => () => typeof window !== "undefined", []);
  return useSyncExternalStore(emptySubscribe, clientSnapshot, () => false);
}
