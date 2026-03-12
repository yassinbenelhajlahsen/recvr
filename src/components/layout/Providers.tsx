"use client";

import { SWRConfig } from "swr";
import { ThemeProvider } from "./ThemeProvider";
import { fetchWithAuth } from "@/lib/fetch";

async function swrFetcher<T>(url: string): Promise<T> {
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  return res.json();
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SWRConfig>
  );
}
