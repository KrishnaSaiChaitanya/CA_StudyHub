"use client";

import React from "react";
import { Flame, Clock, BarChart3, TrendingUp, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DailySummaryPreview: React.FC = () => {
  const days = [
    { day: "M", hrs: 6.2, active: true },
    { day: "T", hrs: 7.5, active: true },
    { day: "W", hrs: 5.0, active: true },
    { day: "T", hrs: 8.1, active: true },
    { day: "F", hrs: 7.0, active: true },
    { day: "S", hrs: 6.5, active: true },
    { day: "S", hrs: 7.8, active: true, today: true },
  ];

  const subjects = [
    { name: "Direct Tax", time: "3h 15m", pct: 48, color: "bg-accent" },
    { name: "Audit & Ethics", time: "2h 15m", pct: 33, color: "bg-sky-500" },
    { name: "Fin. Reporting", time: "1h 15m", pct: 19, color: "bg-indigo-500" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-accent/40">
      {/* Top metrics pill */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-2 text-center shadow-sm">
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <Flame className="h-4 w-4 fill-amber-500/20" />
            <span className="text-sm font-bold">18d</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">Study Streak</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-2 text-center shadow-sm">
          <div className="flex items-center gap-1 text-accent">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-bold">6h 45m</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">Logged Today</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-2 text-center shadow-sm">
          <div className="flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-bold">+18%</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">vs Last Week</span>
        </div>
      </div>

      {/* Mini 7-day consistency chart */}
      <div className="rounded-xl border border-border/50 bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-accent" />
            Weekly Habit Tracker
          </span>
          <span className="text-[10px] text-muted-foreground">48.1 hrs total</span>
        </div>
        <div className="flex items-end justify-between gap-2 pt-2">
          {days.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1">
              <div className="relative w-full flex items-end justify-center h-12 bg-muted/40 rounded-md overflow-hidden">
                <div
                  className={`w-full rounded-md transition-all ${
                    item.today ? "bg-accent shadow-sm" : "bg-accent/40"
                  }`}
                  style={{ height: `${(item.hrs / 9) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] ${item.today ? "font-bold text-accent" : "text-muted-foreground"}`}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject-wise breakdown bar */}
      <div className="rounded-xl border border-border/50 bg-card p-2.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-accent" />
            Subject-Wise Time
          </span>
          <span className="text-muted-foreground text-[10px]">100% Accounted</span>
        </div>

        {/* Stacked multi-color progress bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          {subjects.map((sub) => (
            <div
              key={sub.name}
              className={`${sub.color} transition-all`}
              style={{ width: `${sub.pct}%` }}
              title={`${sub.name}: ${sub.time}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10px] text-muted-foreground">
          {subjects.map((sub) => (
            <div key={sub.name} className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${sub.color}`} />
              <span className="text-foreground font-medium">{sub.name}:</span>
              <span>{sub.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
