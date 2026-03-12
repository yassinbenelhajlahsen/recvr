"use client";

import { useState } from "react";
import useSWR from "swr";
import { Drawer } from "@/components/ui/Drawer";
import { SuggestionPanel } from "./SuggestionPanel";
import { SparklesIcon } from "@/components/ui/icons";
import { useRecovery } from "@/lib/hooks";

export function SuggestionTrigger() {
  const [open, setOpen] = useState(false);
  const { data: recovery = [] } = useRecovery();
  // Prefetch cooldown + cached suggestion on page mount so the drawer
  // opens with data already in the SWR cache (no visible delay).
  useSWR("/api/suggest/cooldown", { revalidateOnFocus: false, dedupingInterval: 60_000 });

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
