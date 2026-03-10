"use client";

import { motion } from "framer-motion";
import type { DateRangePreset } from "@/types/progress";

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
  { label: "All Time", value: "all" },
];

type Props = {
  value: DateRangePreset;
  onChange: (v: DateRangePreset) => void;
};

export function DateRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {PRESETS.map((preset) => {
        const active = value === preset.value;
        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`relative flex-1 rounded-full px-4 py-3 text-xs font-medium transition-colors ${
              active
                ? "text-white shadow-sm"
                : "bg-surface border border-border-subtle text-secondary hover:text-primary hover:border-border"
            }`}
          >
            {active && (
              <motion.span
                layoutId="dateRangePill"
                className="absolute inset-0 rounded-full bg-accent"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
