"use client";

import type { Gender } from "@/types/user";

interface GenderSelectorProps {
  gender: Gender;
  onChange: (gender: Gender) => void;
  buttonPadding?: string;
}

export function GenderSelector({ gender, onChange, buttonPadding = "py-4" }: GenderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["male", "female"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(gender === g ? null : g)}
          className={`rounded-xl border ${buttonPadding} text-sm font-semibold transition-colors duration-150 ${
            gender === g
              ? "bg-accent border-accent text-white"
              : "bg-surface border-border-subtle text-secondary hover:border-border"
          }`}
        >
          {g === "male" ? "Male" : "Female"}
        </button>
      ))}
    </div>
  );
}
