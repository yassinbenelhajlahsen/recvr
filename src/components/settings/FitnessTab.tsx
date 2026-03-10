"use client";

import { GoalSelector } from "@/components/ui/GoalSelector";
import { MetricsInputs } from "@/components/onboarding/MetricsInputs";
import { SectionHeader } from "./SectionHeader";
import { useFitnessForm } from "./hooks/useFitnessForm";
import type { FitnessTabProps } from "@/types/ui";

export function FitnessTab({ user, open, onClose }: FitnessTabProps) {
  const {
    unitSystem,
    setUnitSystem,
    height,
    setHeight,
    weight,
    setWeight,
    goals,
    setGoals,
    customGoal,
    setCustomGoal,
    saving,
    isCustomMode,
    isFitnessDirty,
    toggleGoal,
    handleSaveFitness,
  } = useFitnessForm(user, open, onClose);

  return (
    <>
      {/* ── Body Metrics ── */}
      <section>
        <SectionHeader title="Body Metrics" />
        <MetricsInputs
          idPrefix="settings"
          height={height}
          onHeightChange={setHeight}
          weight={weight}
          onWeightChange={setWeight}
          unitSystem={unitSystem}
          onUnitSystemChange={setUnitSystem}
        />
      </section>

      {/* ── Goals ── */}
      <section>
        <SectionHeader title="Goals" />
        <GoalSelector
          goals={goals}
          customGoal={customGoal}
          onToggleGoal={toggleGoal}
          onCustomGoalChange={(value) => {
            setCustomGoal(value);
            if (value.trim()) setGoals([]);
          }}
          isCustomMode={isCustomMode}
          inputId="settings-custom-goal"
          showDivider={false}
        />
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Recovery tracking will adapt to your goal.
        </p>
      </section>

      <button
        className="w-full px-4 py-3 rounded-xl bg-accent text-white text-sm font-semibold transition-opacity disabled:opacity-40 enabled:hover:opacity-90"
        disabled={!isFitnessDirty || saving}
        onClick={handleSaveFitness}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </>
  );
}
