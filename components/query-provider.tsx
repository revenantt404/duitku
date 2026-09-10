"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Jangan retry 401/403/404: itu sesi mati / bukan-milik — retry cuma
        // memperpanjang skeleton tanpa hasil. 503/timeout (cold start, DB sibuk)
        // tetap retry 1x dengan backoff — server kini fail-fast ≤10 dtk jadi
        // retry tidak menumpuk melebihi timeout client 12 dtk.
        retry: (failureCount, error: any) => {
          const msg = String(error?.message || "");
          if (/401|403|404|Unauthorized|silakan login ulang/i.test(msg)) return false;
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(800 * (attemptIndex + 1), 2_000),
        refetchOnWindowFocus: true,
        refetchOnMount: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => getQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
