"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PerformedExercise } from "@/types/progress";

type Props = {
  exercises: PerformedExercise[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ExerciseSelector({ exercises, selectedId, onSelect }: Props) {
  const selectedExercise = exercises.find((e) => e.id === selectedId);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()),
      )
    : exercises;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleFocus() {
    setOpen(true);
    setQuery("");
  }

  function handleSelect(ex: PerformedExercise) {
    onSelect(ex.id);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  const displayValue = open ? query : selectedExercise?.name ?? "";

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder={open ? "Search exercise…" : "Select exercise…"}
        value={displayValue}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        className="w-full rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
      />

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 w-full rounded-xl border border-border-subtle bg-elevated shadow-lg overflow-hidden max-h-60 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-3.5 py-3 text-sm text-muted">No exercises found</li>
            ) : (
              filtered.map((ex) => {
                const active = ex.id === selectedId;
                return (
                  <li key={ex.id}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur before click
                        handleSelect(ex);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-primary hover:bg-surface"
                      }`}
                    >
                      <span>{ex.name}</span>
                      <span className="text-xs text-muted ml-2 shrink-0">
                        {ex.sessionCount} {ex.sessionCount === 1 ? "session" : "sessions"}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
