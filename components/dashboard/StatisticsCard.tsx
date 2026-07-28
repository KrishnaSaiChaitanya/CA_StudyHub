"use client";

import { ProFeatureLock } from "@/components/shared/ProFeatureLock";
import { Flame, BookOpen, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatisticsCardProps {
  isSubscribed: boolean;
  streak: number;
  totalSessionsCount: number;
  totalHours: number;
  onOpenHistory: () => void;
}

export const StatisticsCard = ({
  isSubscribed,
  streak,
  totalSessionsCount,
  totalHours,
  onOpenHistory,
}: StatisticsCardProps) => {
  const requirePayment = process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === "true";
  const effectiveIsSubscribed = !requirePayment || isSubscribed;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 pb-0 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Statistics</h2>
        <div className="flex items-center gap-2">
          {effectiveIsSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px] px-2.5 border-accent/20 text-accent"
              onClick={onOpenHistory}
            >
              <History className="h-3 w-3" /> History
            </Button>
          ) : (
            <span className="text-[10px] font-bold text-accent">PRO</span>
          )}
        </div>
      </div>
      <ProFeatureLock label="Unlock statistics with a Pro Subscription">
        <div className="p-5 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Flame className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <p className="text-lg font-bold">{streak} Days</p>
                <p className="text-[10px] text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <BookOpen className="mx-auto h-4 w-4 text-accent mb-1" />
              <p className="text-sm font-bold">{totalSessionsCount}</p>
              <p className="text-[9px] text-muted-foreground">Total Sessions</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <Clock className="mx-auto h-4 w-4 text-accent mb-1" />
              <p className="text-sm font-bold">{totalHours.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </div>
      </ProFeatureLock>
    </div>
  );
};
