"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DATE_PRESETS = [
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
  { label: "All Time", value: "" },
];

const PINNED_MUSCLES = ["chest", "back", "glutes", "quadriceps"];

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "glutes",
  "quadriceps",
  "biceps",
  "calves",
  "core",
  "hamstrings",
  "lower back",
  "rear shoulders",
  "shoulders",
  "traps",
  "triceps",
];

const MUSCLE_LABELS: Record<string, string> = {
  quadriceps: "Quads",
  "lower back": "Lower Back",
  "rear shoulders": "Rear Delts",
  core: "Core/Abs",
};

function parseMuscles(param: string | null): string[] {
  return param ? param.split(",").filter(Boolean) : [];
}

export function WorkoutsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [datePreset, setDatePreset] = useState(
    searchParams.get("datePreset") ?? "",
  );
  const [muscles, setMuscles] = useState<string[]>(
    parseMuscles(searchParams.get("muscles")),
  );

  // Refs so debounced search can read latest date/muscles without re-creating the timer
  const datePresetRef = useRef(datePreset);
  const musclesRef = useRef(muscles);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(s: string, d: string, m: string[]) {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (d) params.set("datePreset", d);
    if (m.length) params.set("muscles", m.join(","));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      push(val, datePresetRef.current, musclesRef.current);
    }, 400);
  }

  function handleDateChange(val: string) {
    setDatePreset(val);
    datePresetRef.current = val;
    push(search, val, musclesRef.current);
  }

  function toggleMuscle(m: string) {
    const next = muscles.includes(m)
      ? muscles.filter((x) => x !== m)
      : [...muscles, m];
    setMuscles(next);
    musclesRef.current = next;
    push(search, datePresetRef.current, next);
  }

  const extraMuscles = MUSCLE_GROUPS.filter((m) => !PINNED_MUSCLES.includes(m));
  const hasActiveInExtra = extraMuscles.some((m) => muscles.includes(m));

  const [showAll, setShowAll] = useState(hasActiveInExtra);

  const hiddenCount = extraMuscles.length;

  return (
    <div
      className={`space-y-3 transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      {/* Search + date range pills on one row */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by exercise…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 min-w-40 rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />

        {DATE_PRESETS.map((preset) => {
          const active = datePreset === preset.value;
          return (
            <button
              key={preset.value || "all"}
              onClick={() => handleDateChange(preset.value)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "text-white shadow-sm"
                  : "bg-surface border border-border-subtle text-secondary hover:text-primary hover:border-border"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="dashboardDatePill"
                  className="absolute inset-0 rounded-full bg-accent"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{preset.label}</span>
            </button>
          );
        })}
      </div>{/* end search + date row */}

      {/* Muscle pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {PINNED_MUSCLES.map((m) => {
          const active = muscles.includes(m);
          const label =
            MUSCLE_LABELS[m] ?? m.charAt(0).toUpperCase() + m.slice(1);
          return (
            <button
              key={m}
              onClick={() => toggleMuscle(m)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface border border-border-subtle text-secondary hover:text-primary hover:border-border"
              }`}
            >
              {label}
            </button>
          );
        })}

        <AnimatePresence initial={false}>
          {showAll &&
            extraMuscles.map((m, i) => {
              const active = muscles.includes(m);
              const label =
                MUSCLE_LABELS[m] ?? m.charAt(0).toUpperCase() + m.slice(1);
              return (
                <motion.button
                  key={m}
                  onClick={() => toggleMuscle(m)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent text-white shadow-sm"
                      : "bg-surface border border-border-subtle text-secondary hover:text-primary hover:border-border"
                  }`}
                >
                  {label}
                </motion.button>
              );
            })}
        </AnimatePresence>

        <button
          onClick={() => setShowAll((v) => !v)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
            hasActiveInExtra && !showAll
              ? "border-accent text-accent hover:bg-accent/10"
              : "border-border-subtle text-muted hover:text-primary hover:border-border"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showAll ? "less" : "more"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              {showAll ? "Show less" : `+${hiddenCount} more`}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
