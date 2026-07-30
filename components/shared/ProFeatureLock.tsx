"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { ReactNode } from "react";
import { motion } from "framer-motion";

export const ProFeatureLock = ({ children, label }: { children: ReactNode, label?: string }) => {
  const { isSubscribed, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="relative w-full h-full min-h-[160px] flex items-center justify-center overflow-hidden rounded-[inherit] bg-muted/80 border border-muted/40 blur-[1px]">
        <div className="flex flex-col items-center justify-center w-full animate-pulse space-y-4 py-4">
          <div className="h-14 w-14 rounded-full bg-muted-foreground/20" />
          <div className="space-y-2 w-full flex flex-col items-center mt-3">
            <div className="h-4 w-48 rounded bg-muted-foreground/20" />
          </div>
          <div className="h-11 w-40 rounded-md bg-muted-foreground/20 mt-4" />
        </div>
      </div>
    );
  }

  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === 'true';

  if (!requirePayment || isSubscribed) return <>{children}</>;

  return (
    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center overflow-hidden rounded-[inherit] ">
      <div className="absolute rounded-lg inset-0 z-0 opacity-[0.25] pointer-events-none blur-[1px] grayscale-[0.5] transition-all">
        {children}
      </div>

      <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px] z-5 rounded" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/80 backdrop-blur-sm rounded-lg"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10">
          <Lock className="h-7 w-7 text-accent" />
        </div>

        <p className="mt-3 max-w-xs text-sm font-medium text-primary-foreground text-center">
         {label ?? "Unlock full mock exams with a Pro subscription"}
        </p>

        <Button
          size="lg"
          onClick={() => router.push("/pricing")}
          className="mt-4 bg-accent text-accent-foreground shadow-accent hover:bg-accent/90"
        >
          <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
        </Button>
      </motion.div>
    </div>
  );
};
