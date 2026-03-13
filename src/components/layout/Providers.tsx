"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { fetchWithAuth } from "@/lib/fetch";

async function swrFetcher<T>(url: string): Promise<T> {
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  return res.json();
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-center" richColors duration={1500}/>;
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
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SWRConfig>
  );
}
