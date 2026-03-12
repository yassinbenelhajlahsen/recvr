import { useState, useEffect } from "react";
import useSWR from "swr";
import type { MuscleRecovery } from "@/types/recovery";
import type { ProgressClientProps } from "@/types/progress";

/**
 * Shared SWR hook for recovery data. Key "/api/recovery" is shared across all
 * pages — navigating between dashboard and /recovery never refetches if the
 * cache is still fresh. Pass `fallbackData` from the server component so the
 * first render is instant (no loading state).
 */
export function useRecovery(fallbackData?: MuscleRecovery[]) {
  return useSWR<MuscleRecovery[]>("/api/recovery", { fallbackData, dedupingInterval: 30_000 });
}

/**
 * Shared SWR hook for progress data. Key "/api/progress" is shared across all
 * pages — navigating away and back uses the SWR cache.
 */
export function useProgress() {
  return useSWR<ProgressClientProps>("/api/progress", { dedupingInterval: 30_000 });
}

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity. Used to throttle SWR keys for search inputs.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

