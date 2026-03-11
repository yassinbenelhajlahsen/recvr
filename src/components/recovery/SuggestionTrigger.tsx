"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SuggestionPanel } from "./SuggestionPanel";
import { SparklesIcon } from "@/components/ui/icons";
import type { MuscleRecovery } from "@/types/recovery";

interface SuggestionTriggerProps {
  recovery: MuscleRecovery[];
}

export function SuggestionTrigger({ recovery }: SuggestionTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary border border-border rounded-lg px-4 py-2 hover:bg-surface hover:text-primary transition-colors shrink-0"
      >
        <SparklesIcon />
        Plan Workout
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Workout Planner"
      >
        <SuggestionPanel recovery={recovery} onDismiss={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
