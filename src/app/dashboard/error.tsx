"use client";

import { FetchError } from "@/components/ui/FetchError";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <FetchError onRetry={reset} />;
}
