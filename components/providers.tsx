"use client";

import { QueryClient, QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState } from "react";
import { SubscriptionProvider } from "./SubscriptionProvider";
import { StudentTypeProvider } from "./StudentTypeProvider";
import { StudyTimerProvider } from "./StudyTimerProvider";

const CACHE_KEY = "CA_STUDYHUB_QUERY_CACHE";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // Data remains fresh for 1 minute
          refetchOnWindowFocus: false, // Prevents aggressive refetching
          retry: 1, // Only retry failed requests once
        },
      },
    });

    if (typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          hydrate(client, JSON.parse(cachedData));
        }
      } catch (err) {
        console.error("Failed to restore query cache:", err);
      }

      client.getQueryCache().subscribe(() => {
        try {
          const state = dehydrate(client);
          localStorage.setItem(CACHE_KEY, JSON.stringify(state));
        } catch (err) {
          console.error("Failed to save query cache:", err);
        }
      });
    }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubscriptionProvider>
          <StudentTypeProvider>
            <StudyTimerProvider>
              {children}
            </StudyTimerProvider>
            <Toaster />
            <Sonner />
          </StudentTypeProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
