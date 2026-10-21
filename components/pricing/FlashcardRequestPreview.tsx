"use client";

import React, { useState } from "react";
import { Sparkles, Layers, RotateCw, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const FlashcardRequestPreview: React.FC = () => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-accent/40">
      {/* Request status chip */}
      <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">Requested: Ind AS 116 Leases</p>
            <p className="text-[10px] text-muted-foreground">Custom set created by CA team</p>
          </div>
        </div>
        <Badge variant="outline" className="border-accent/30 bg-accent/15 text-[10px] text-accent shrink-0 font-medium">
          Ready to Revise
        </Badge>
      </div>

      {/* Interactive Flashcard with Flip Action */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="group relative flex min-h-[140px] cursor-pointer flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-300 hover:border-accent/40 hover:shadow-md"
      >
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-2">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Layers className="h-3.5 w-3.5 text-accent" />
            {flipped ? "Answer (Back)" : "Question (Front)"}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-accent group-hover:underline">
            <RotateCw className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" />
            Click to Flip
          </span>
        </div>

        <div className="py-2.5">
          {!flipped ? (
            <p className="text-xs font-semibold text-foreground leading-relaxed">
              What are the 2 exemptions from recognition under Ind AS 116 Leases?
            </p>
          ) : (
            <div className="text-xs text-foreground/90 space-y-1">
              <p className="font-semibold text-accent flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 1. Short-term leases (≤ 12 months)
              </p>
              <p className="font-semibold text-accent flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 2. Leases of low-value assets
              </p>
              <p className="text-[10px] text-muted-foreground pt-1">
                Expense recognized on a straight-line basis over lease term.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
          <span className="text-amber-500 font-medium">★ Toughest Topic Priority</span>
          <span>Card 4 of 24</span>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Tailored for your tough concepts</span>
        <span className="font-medium text-accent">Active Recall</span>
      </div>
    </div>
  );
};
