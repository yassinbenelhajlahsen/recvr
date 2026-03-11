"use client";

import { useRef, useState } from "react";
import type { WorkoutSuggestion } from "@/types/suggestion";

type SuggestionState = {
  suggestion: WorkoutSuggestion | null;
  isLoading: boolean;
  error: string | null;
};

export function useSuggestion() {
  const [state, setState] = useState<SuggestionState>({
    suggestion: null,
    isLoading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  async function generate(selectedPresets?: string[]) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ suggestion: null, isLoading: true, error: null });
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPresets: selectedPresets?.length ? selectedPresets : undefined }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ suggestion: null, isLoading: false, error: data.error ?? "Something went wrong" });
        return;
      }
      setState({ suggestion: data, isLoading: false, error: null });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState({ suggestion: null, isLoading: false, error: "Failed to connect. Please try again." });
    }
  }

  function dismiss() {
    abortRef.current?.abort();
    setState({ suggestion: null, isLoading: false, error: null });
  }

  return { ...state, generate, dismiss };
}
