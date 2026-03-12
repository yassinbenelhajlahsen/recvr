import { ProgressClient } from "@/components/progress/ProgressClient";

// Synchronous — no async/await so loading.tsx never triggers.
// Auth is handled by middleware (src/proxy.ts).
// Progress data is fetched client-side via SWR.
export default function ProgressPage() {
  return (
    <div className="px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl text-primary tracking-tight mb-2">
          Progress
        </h1>
        <p className="text-secondary">
          Track your strength and body weight over time.
        </p>
      </div>
      <ProgressClient />
    </div>
  );
}
