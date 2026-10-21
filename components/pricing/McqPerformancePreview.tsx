"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, TrendingUp, Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const McqPerformancePreview: React.FC = () => {
  const [showExplanation, setShowExplanation] = useState(true);

  const testAttempts = [
    { num: "#1", score: 58, date: "10 Oct" },
    { num: "#2", score: 72, date: "14 Oct" },
    { num: "#3", score: 84, date: "18 Oct" },
    { num: "#4", score: 92, date: "Today", best: true },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-accent/40">
      {/* Test history progression */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Score Progression</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +34%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Watch progress build attempt after attempt</p>
          </div>
        </div>

        {/* Attempt Pills */}
        <div className="flex items-center gap-1.5">
          {testAttempts.map((att) => (
            <div
              key={att.num}
              className={`flex flex-col items-center rounded-lg px-2 py-1 text-center transition-all ${
                att.best
                  ? "bg-accent text-accent-foreground font-bold shadow-sm"
                  : "bg-muted/70 text-muted-foreground"
              }`}
            >
              <span className="text-[9px] opacity-80">{att.num}</span>
              <span className="text-xs font-bold leading-tight">{att.score}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question Snippet */}
      <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-accent" />
            Taxation MCQ · Question 8
          </span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Correct +2 pts
          </Badge>
        </div>

        <p className="text-xs font-medium text-foreground leading-snug">
          Tax Audit threshold u/s 44AB for business where cash receipts/payments ≤ 5% is:
        </p>

        {/* Selected Correct Option */}
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Option B: ₹10 Crores
          </span>
          <span className="text-[10px] font-normal uppercase tracking-wider">Correct Option</span>
        </div>

        {/* Explanation Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex w-full items-center justify-between text-[11px] font-medium text-accent hover:underline py-0.5"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Detailed Why-Explanation
            </span>
            {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showExplanation && (
            <div className="mt-1.5 rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground font-semibold">ICAI Law Rationale: </strong>
              The threshold is enhanced from ₹1 Cr to ₹10 Cr provided aggregate cash receipts and cash payments do not exceed 5% of aggregate turnover and payments respectively.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
