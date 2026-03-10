"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const DATE_PRESETS = [
  { label: "All time", value: "" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

const MUSCLE_GROUPS = [
  "back",
  "biceps",
  "calves",
  "chest",
  "core",
  "glutes",
  "hamstrings",
  "lower back",
  "quadriceps",
  "rear shoulders",
  "shoulders",
  "traps",
  "triceps",
];

function parseMuscles(param: string | null): string[] {
  return param ? param.split(",").filter(Boolean) : [];
}

export function WorkoutsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") ?? "");
  const [muscles, setMuscles] = useState<string[]>(parseMuscles(searchParams.get("muscles")));

  // Refs so debounced search can read latest date/muscles without re-creating the timer
  const datePresetRef = useRef(datePreset);
  const musclesRef = useRef(muscles);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(s: string, d: string, m: string[]) {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (d) params.set("datePreset", d);
    if (m.length) params.set("muscles", m.join(","));
    router.push(`${pathname}?${params.toString()}`);
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
    const next = muscles.includes(m) ? muscles.filter((x) => x !== m) : [...muscles, m];
    setMuscles(next);
    musclesRef.current = next;
    push(search, datePresetRef.current, next);
  }

  function clear() {
    setSearch("");
    setDatePreset("");
    setMuscles([]);
    datePresetRef.current = "";
    musclesRef.current = [];
    router.push(pathname);
  }

  const COLLAPSED_COUNT = 8;
  const hiddenMuscles = MUSCLE_GROUPS.slice(COLLAPSED_COUNT);
  const hasActiveInHidden = hiddenMuscles.some((m) => muscles.includes(m));

  const [showAll, setShowAll] = useState(false);

  // Auto-expand if a selected muscle is in the hidden rows
  useEffect(() => {
    if (hasActiveInHidden) setShowAll(true);
  }, [hasActiveInHidden]);

  const visibleMuscles = showAll ? MUSCLE_GROUPS : MUSCLE_GROUPS.slice(0, COLLAPSED_COUNT);
  const hiddenCount = MUSCLE_GROUPS.length - COLLAPSED_COUNT;

  const hasFilters = !!(
    searchParams.get("search") ||
    searchParams.get("datePreset") ||
    searchParams.get("muscles")
  );

  return (
    <div className="space-y-3">
      {/* Row: search + date preset + clear */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search by exercise…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />

        <select
          value={datePreset}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors cursor-pointer"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clear}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Muscle pills — fixed grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {visibleMuscles.map((m) => {
            const active = muscles.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className={`rounded-lg py-1.5 text-xs font-medium transition-colors text-center truncate ${
                  active
                    ? "bg-accent text-white"
                    : "bg-surface border border-border-subtle text-secondary hover:text-primary hover:border-border"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          {showAll ? "Show less" : `+${hiddenCount} more`}
        </button>
      </div>
    </div>
  );
}
