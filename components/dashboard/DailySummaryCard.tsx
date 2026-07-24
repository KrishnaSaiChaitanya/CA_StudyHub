"use client";

import { ProFeatureLock } from "@/components/shared/ProFeatureLock";
import { Lock } from "lucide-react";

interface DailySummaryCardProps {
  isSubscribed: boolean;
  dailyData: { category: string; hours: number }[];
  totalHours: number;
  getSubjectColor: (val: string) => string;
  getSubjectLabel: (val: string) => string;
}

const PieChart = ({
  dailyData,
  totalHours,
  getSubjectColor,
}: {
  dailyData: { category: string; hours: number }[];
  totalHours: number;
  getSubjectColor: (val: string) => string;
}) => {
  let cumulative = 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 200 200">
        {totalHours === 0 ? (
          <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="24" />
        ) : (
          dailyData.map((item) => {
            const fraction = item.hours / totalHours;
            const dashLength = fraction * circumference;
            const dashOffset = -(cumulative / totalHours) * circumference;
            cumulative += item.hours;
            return (
              <circle
                key={item.category}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={getSubjectColor(item.category)}
                strokeWidth="24"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            );
          })
        )}
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-card-foreground">{totalHours.toFixed(1)}h</p>
        <p className="text-[10px] text-muted-foreground">Today</p>
      </div>
    </div>
  );
};

export const DailySummaryCard = ({
  isSubscribed,
  dailyData,
  totalHours,
  getSubjectColor,
  getSubjectLabel,
}: DailySummaryCardProps) => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 pb-0 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Daily Summary</h2>
        {!isSubscribed && <Lock className="h-3 w-3 text-muted-foreground/50" />}
      </div>
      <ProFeatureLock label="Unlock daily summary with a Pro Subscription">
        <div className="p-5 pt-4">
          <PieChart dailyData={dailyData} totalHours={totalHours} getSubjectColor={getSubjectColor} />
          <div className="mt-4 space-y-2">
            {dailyData.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getSubjectColor(item.category) }} />
                  <span className="text-muted-foreground">{getSubjectLabel(item.category)}</span>
                </div>
                <span className="font-medium text-card-foreground">{item.hours.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      </ProFeatureLock>
    </div>
  );
};
