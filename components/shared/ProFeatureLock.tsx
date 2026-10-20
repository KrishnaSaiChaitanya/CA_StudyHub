"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { ReactNode } from "react";
import { motion } from "framer-motion";

export const ProFeatureLock = ({
  children,
  label = "Unlock with a Pro Subscription",
}: {
  children: ReactNode;
  label?: string;
}) => {
  const { isSubscribed, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="relative w-full h-full min-h-[180px] flex items-center justify-center overflow-hidden rounded-[inherit] bg-card border border-border/40">
        <div className="flex flex-col items-center justify-center w-full animate-pulse space-y-3 py-6 px-4">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-muted" />
          <div className="h-4 w-44 rounded-md bg-muted" />
          <div className="h-8 w-32 rounded-lg bg-muted mt-1" />
        </div>
      </div>
    );
  }

  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true";

  if (!requirePayment || isSubscribed) return <>{children}</>;

  return (
    <div className="relative w-full h-full min-h-[190px] flex items-center justify-center overflow-hidden rounded-[inherit]">
      <div
        className="w-full h-full select-none pointer-events-none filter blur-[2.5px] opacity-35 dark:opacity-20 grayscale-[0.4] transition-all"
        aria-hidden="true"
      >
        {children}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 text-center bg-background/80 dark:bg-card/85 backdrop-blur-md rounded-[inherit] border border-border/50 shadow-sm"
      >
        {/* Subtle decorative glow in top center */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-accent/15 dark:bg-accent/20 blur-3xl" />

        <div className="relative mb-2.5 flex items-center justify-center">
          <div className="absolute -inset-1 rounded-full bg-accent/20 dark:bg-accent/25 blur-sm" />
          <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-accent/30 bg-background dark:bg-card text-accent shadow-sm">
            <Lock className="h-5 w-5 text-accent" />
          </div>
        </div>

        <p className="text-xs sm:text-sm font-medium text-foreground text-center px-3 max-w-sm tracking-tight">
          {label}
        </p>

        <Button
          size="sm"
          onClick={() => router.push("/pricing")}
          className="mt-3.5 bg-accent text-accent-foreground font-semibold shadow-md shadow-accent/20 hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center gap-1.5 px-4 py-2 h-8 text-xs rounded-lg"
        >
          <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
          Upgrade to Pro
        </Button>
      </motion.div>
    </div>
  );
};
