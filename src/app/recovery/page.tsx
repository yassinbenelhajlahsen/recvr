import { RecoveryView } from "@/components/recovery/RecoveryView";
import { SuggestionTrigger } from "@/components/recovery/SuggestionTrigger";

// Synchronous — no async/await so loading.tsx never triggers.
// Auth is handled by middleware (src/proxy.ts).
// Recovery + gender are fetched client-side via SWR.
export default function RecoveryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-primary tracking-tight mb-2">
            Recovery
          </h1>
          <p className="text-secondary">
            Your muscle recovery status based on recent workout history.
          </p>
        </div>
        <SuggestionTrigger />
      </div>
      <RecoveryView />
    </div>
  );
}
