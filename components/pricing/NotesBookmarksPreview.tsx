"use client";

import React, { useState } from "react";
import { Bookmark, StickyNote, Tag, Check, Pin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const NotesBookmarksPreview: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "provisions" | "formulas">("provisions");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-accent/40">
      {/* Category Filter Pills */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Bookmark className="h-4 w-4 text-accent" />
          <span>Quick Hub</span>
        </div>
        <div className="flex gap-1 text-[10px]">
          {(["all", "provisions", "formulas"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-md px-2 py-0.5 capitalize transition-all ${
                activeFilter === filter
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sticky Note Preview */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 shadow-sm dark:bg-amber-950/20">
        <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-amber-500/20">
          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Pin className="h-3 w-3" />
            Tricky Provision · Sec 115BAC
          </span>
          <span className="text-[10px] text-muted-foreground">Revision Tag</span>
        </div>
        <p className="mt-1.5 text-xs text-foreground/90 leading-relaxed font-sans">
          "New Regime: Std deduction ₹75,000 allowed. Chapter VI-A deductions (80C, 80D) disallowed, but Sec 80CCD(2) employer contribution remains deductible!"
        </p>
      </div>

      {/* Bookmarked Question / Item */}
      <div className="rounded-xl border border-border/60 bg-card p-2.5 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Bookmark className="h-3 w-3 fill-accent" />
            </span>
            <span className="truncate font-medium text-foreground text-xs">
              Nov 2024 RTP Q.4 — Foreign Currency Gain
            </span>
          </div>
          <Badge variant="outline" className="border-border text-[9px] px-1.5 py-0 text-muted-foreground shrink-0">
            Revisit
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground pl-7">
          Saved with personal notes: "Check treatment of monetary items under Ind AS 21."
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-0.5">
        <span className="text-accent font-medium">Searchable & Organised</span>
        <span>Zero doubts forgotten before exams</span>
      </div>
    </div>
  );
};
