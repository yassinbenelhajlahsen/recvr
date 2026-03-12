import { useState, useRef, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useDebouncedValue } from "@/lib/hooks";
import type { Exercise } from "@/types/workout";

export function useExerciseSearch() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const key = showSearch
    ? `/api/exercises?q=${encodeURIComponent(debouncedQuery)}`
    : null;

  const { data, isLoading: searchLoading } = useSWR<Exercise[]>(key, {
    keepPreviousData: true,
    dedupingInterval: 30_000,
  });
  const searchResults = data ?? [];

  // Focus input when search panel opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  // Close on outside click
  useEffect(() => {
    if (!showSearch) return;
    const handle = (e: MouseEvent) => {
      if (!searchPanelRef.current?.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery("");
        setShowCustomForm(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showSearch]);

  function openSearch() {
    setShowSearch(true);
  }

  function closeSearch() {
    setShowSearch(false);
    setSearchQuery("");
    setShowCustomForm(false);
  }

  function clearCache() {
    globalMutate(
      (k) => typeof k === "string" && k.startsWith("/api/exercises"),
      undefined,
      { revalidate: true }
    );
  }

  return {
    showSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchPanelRef,
    searchInputRef,
    showCustomForm,
    setShowCustomForm,
    openSearch,
    closeSearch,
    clearCache,
  };
}
