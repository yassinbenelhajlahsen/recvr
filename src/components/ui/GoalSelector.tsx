"use client";

import { FloatingInput } from "@/components/ui/FloatingInput";

export const GOALS = ["Strength", "Hypertrophy", "Endurance", "Fat Loss"] as const;

interface GoalSelectorProps {
  goals: string[];
  customGoal: string;
  onToggleGoal: (goal: string) => void;
  onCustomGoalChange: (value: string) => void;
  isCustomMode: boolean;
  inputId: string;
  showDivider?: boolean;
}

export function GoalSelector({
  goals,
  customGoal,
  onToggleGoal,
  onCustomGoalChange,
  isCustomMode,
  inputId,
  showDivider = true,
}: GoalSelectorProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((g) => {
          const selected = goals.includes(g);
          const disabled = !selected && goals.length >= 3;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onToggleGoal(g)}
              disabled={disabled || isCustomMode}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors duration-150 ${
                selected
                  ? "bg-accent text-white border-accent"
                  : "bg-surface border-border-subtle text-primary hover:border-border disabled:opacity-40 disabled:pointer-events-none"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {showDivider ? (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <FloatingInput
            id={inputId}
            type="text"
            label="Custom goal"
            value={customGoal}
            onChange={(e) => onCustomGoalChange(e.target.value)}
            required={false}
          />
        </>
      ) : (
        <div className="mt-3">
          <FloatingInput
            id={inputId}
            type="text"
            label="Custom goal"
            value={customGoal}
            onChange={(e) => onCustomGoalChange(e.target.value)}
            required={false}
          />
        </div>
      )}
    </>
  );
}
