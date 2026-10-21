"use client";

import React, { useState } from "react";
import { Calendar, CheckCircle2, Circle, Clock, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const StudyPlanningPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"days" | "modules">("days");

  const subjects = [
    { name: "Financial Reporting", days: 18, color: "bg-accent", progress: 65 },
    { name: "Advanced Auditing", days: 16, color: "bg-sky-500", progress: 80 },
    { name: "Direct Tax Laws", days: 18, color: "bg-indigo-500", progress: 45 },
    { name: "Indirect Tax Laws", days: 14, color: "bg-teal-500", progress: 30 },
  ];

  const modules = [
    { title: "Module 1: Standards on Auditing", status: "completed", count: "12/12 Topics", tag: "Completed" },
    { title: "Module 2: Risk Assessment & Internal Controls", status: "in-progress", count: "7/10 Topics", tag: "Study 1" },
    { title: "Module 3: Special Areas & Audit Reports", status: "pending", count: "0/8 Topics", tag: "Pending" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-accent/40">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Exam Date: 15 Nov 2026</span>
              <Badge variant="outline" className="border-accent/40 bg-accent/10 px-1.5 py-0 text-[10px] font-medium text-accent">
                <Sparkles className="mr-1 h-2.5 w-2.5" /> 66 Days Left
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Auto-divided across your 4 subjects</p>
          </div>
        </div>

        {/* Mini Tab Switcher */}
        <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("days")}
            className={`rounded-md px-2 py-1 font-medium transition-all ${
              activeTab === "days"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Days Division
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("modules")}
            className={`rounded-md px-2 py-1 font-medium transition-all ${
              activeTab === "modules"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ICAI Modules
          </button>
        </div>
      </div>

      {activeTab === "days" ? (
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {subjects.map((sub) => (
              <div key={sub.name} className="rounded-xl border border-border/50 bg-card p-2.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="truncate">{sub.name.split(" ")[0]}</span>
                  <span className="font-bold text-accent">{sub.days}d</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-base font-bold text-foreground">{sub.days}</span>
                  <span className="text-[10px] text-muted-foreground">days assigned</span>
                </div>
                <Progress value={sub.progress} className="mt-2 h-1.5 bg-muted" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accent/5 px-3 py-1.5 text-[11px] text-muted-foreground border border-accent/15">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Clock className="h-3.5 w-3.5 text-accent" />
              Target: 8.5 hrs/day
            </span>
            <span className="text-accent font-semibold">100% Curriculum Covered</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-2.5 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {mod.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : mod.status === "in-progress" ? (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{mod.title}</p>
                  <p className="text-[10px] text-muted-foreground">{mod.count}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 shrink-0 ${
                  mod.status === "completed"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : mod.status === "in-progress"
                    ? "border-accent/40 bg-accent/10 text-accent font-medium"
                    : "border-border text-muted-foreground"
                }`}
              >
                {mod.tag}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
