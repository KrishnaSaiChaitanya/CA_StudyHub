"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bookmark, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookmarkProModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType?: "question" | "paper" | "planner" | "material" | "item";
}

export const BookmarkProModal: React.FC<BookmarkProModalProps> = ({
  open,
  onOpenChange,
  itemType = "item",
}) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/pricing");
  };

  const getItemLabel = () => {
    switch (itemType) {
      case "question":
        return "questions";
      case "paper":
        return "practice papers";
      case "planner":
        return "study planners";
      case "material":
        return "materials";
      default:
        return "items";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 bg-card shadow-2xl">
        {/* Subtle top accent gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />

        <div className="relative p-6 pt-5">
          {/* Subtle glow effect */}
          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full bg-accent/15 blur-3xl" />

          {/* Icon + Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute -inset-2 rounded-full bg-accent/20 blur-md" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-background dark:bg-card/90 text-accent shadow-md">
                <Bookmark className="h-7 w-7 fill-accent/20 text-accent" />
              </div>
            </div>

            <Badge
              variant="outline"
              className="border-accent/30 bg-accent/10 text-accent text-[11px] font-semibold px-2.5 py-0.5 mb-2 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              PRO FEATURE
            </Badge>

            <DialogHeader className="text-center space-y-1.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-center">
                Bookmarks are a Pro Feature
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm text-center">
                Saving {getItemLabel()} to your personal library is available exclusively for CA StudyHub Pro members.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Benefits Card */}
          <div className="mt-5 rounded-xl border border-border/70 bg-secondary/40 p-4 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-foreground">1-Click Library:</strong> Bookmark questions, RTP/MTPs & planners for instant access.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-foreground">Personal Revision Notes:</strong> Attach reminders, key sections & formulas to bookmarks.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-foreground">Zero Doubts Forgotten:</strong> Review all bookmarked items in one unified hub before exams.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              className="w-full h-10 bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow-md shadow-accent/20 flex items-center justify-center gap-2 group text-sm"
            >
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-white h-9"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
